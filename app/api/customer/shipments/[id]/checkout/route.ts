// app/api/customer/shipments/[id]/checkout/route.ts

import { db } from '@/lib/db/drizzle';
import { 
  shipments, 
  addresses, 
  customerProfiles,
  shipmentPackages,
  packages
} from '@/lib/db/schema';
import { stripe } from '@/lib/payments/stripe';
import { StorageFeeCalculator } from '@/lib/services/storage-fee-calculator';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getUserWithProfile } from '@/lib/db/queries';
import { RouteContext } from '@/lib/utils/route';

export async function POST(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = (await RouteContext.params).id;

    // Get shipment details with current costs
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        shippingCost: shipments.shippingCost,
        insuranceCost: shipments.insuranceCost,
        handlingFee: shipments.handlingFee,
        storageFee: shipments.storageFee,
        quoteExpiresAt: shipments.quoteExpiresAt,
        shippingAddressId: shipments.shippingAddressId,
        rateCalculationDetails: shipments.rateCalculationDetails,
        createdAt: shipments.createdAt
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const shipment = shipmentQuery[0];

    // Check if shipment is in valid status for payment
    if (shipment.status !== 'quoted') {
      return NextResponse.json(
        { error: 'Shipment is not ready for payment' },
        { status: 400 }
      );
    }

    // Check if quote has expired
    if (shipment.quoteExpiresAt && new Date() > new Date(shipment.quoteExpiresAt)) {
      return NextResponse.json(
        { error: 'Quote has expired. Please request a new quote.' },
        { status: 400 }
      );
    }

    // Get packages for real-time storage fee calculation
    const packageQuery = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        warehouseId: packages.warehouseId,
        receivedAt: packages.receivedAt
      })
      .from(shipmentPackages)
      .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(eq(shipmentPackages.shipmentId, shipmentId));

    // Recalculate storage fees to ensure accuracy at payment time
    const currentStorageFees = await StorageFeeCalculator.calculateStorageFees({
      packages: packageQuery,
      tenantId: userWithProfile.customerProfile.tenantId
    });

    // Check if storage fees have changed significantly (more than $1 difference)
    const currentStorageFee = currentStorageFees.totalStorageFee;
    const quotedStorageFee = parseFloat(shipment.storageFee || '0');
    const storageFeeChange = Math.abs(currentStorageFee - quotedStorageFee);

    let updatedTotalCost = parseFloat(shipment.totalCost || '0');

    // Update storage fee if it has changed significantly
    if (storageFeeChange > 1.00) {
      const shippingCost = parseFloat(shipment.shippingCost || '0');
      const insuranceCost = parseFloat(shipment.insuranceCost || '0');
      const handlingFee = parseFloat(shipment.handlingFee || '0');
      
      updatedTotalCost = shippingCost + insuranceCost + handlingFee + currentStorageFee;

      // Update shipment with new storage fee and total cost
      await db
        .update(shipments)
        .set({
          storageFee: currentStorageFee.toString(),
          totalCost: updatedTotalCost.toString(),
          updatedAt: new Date()
        })
        .where(eq(shipments.id, shipmentId));
    }

    // Validate total cost
    if (updatedTotalCost <= 0) {
      return NextResponse.json(
        { error: 'Invalid shipment cost' },
        { status: 400 }
      );
    }

    // Get shipping address for payment description
    const addressQuery = await db
      .select({
        city: addresses.city,
        countryCode: addresses.countryCode,
        name: addresses.name,
      })
      .from(addresses)
      .where(eq(addresses.id, shipment.shippingAddressId || ''))
      .limit(1);

    const shippingAddress = addressQuery[0];
    const destination = shippingAddress 
      ? `${shippingAddress.city}, ${shippingAddress.countryCode}` 
      : 'International';

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(updatedTotalCost * 100), // Convert to cents
      currency: shipment.costCurrency?.toLowerCase() || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        customerId: userWithProfile.customerProfile.id,
        tenantId: userWithProfile.customerProfile.tenantId,
        originalStorageFee: quotedStorageFee.toString(),
        updatedStorageFee: currentStorageFee.toString(),
        storageFeeChanged: storageFeeChange > 1.00 ? 'true' : 'false'
      },
      description: `Shipping for ${shipment.shipmentNumber} to ${destination}`,
      receipt_email: userWithProfile.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: updatedTotalCost,
      currency: shipment.costCurrency || 'USD',
      storageFeeUpdate: storageFeeChange > 1.00 ? {
        originalFee: quotedStorageFee,
        updatedFee: currentStorageFee,
        change: currentStorageFee - quotedStorageFee,
        reason: 'Storage fees updated based on current storage duration'
      } : null,
      storageBreakdown: currentStorageFees.breakdown,
      shipment: {
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        destination,
        packageCount: packageQuery.length
      },
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = (await RouteContext.params).id;

    // Get shipment checkout details
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        shippingCost: shipments.shippingCost,
        insuranceCost: shipments.insuranceCost,
        handlingFee: shipments.handlingFee,
        storageFee: shipments.storageFee,
        serviceType: shipments.serviceType,
        totalWeightKg: shipments.totalWeightKg,
        quoteExpiresAt: shipments.quoteExpiresAt,
        rateCalculationDetails: shipments.rateCalculationDetails,
        shippingAddressId: shipments.shippingAddressId,
        billingAddressId: shipments.billingAddressId,
        baseShippingRate: shipments.baseShippingRate,
        weightShippingRate: shipments.weightShippingRate,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const shipment = shipmentQuery[0];

    // Get addresses
    const addressQueries = await Promise.all([
      // Shipping address
      shipment.shippingAddressId ? db
        .select()
        .from(addresses)
        .where(eq(addresses.id, shipment.shippingAddressId))
        .limit(1) : Promise.resolve([]),
      
      // Billing address
      shipment.billingAddressId ? db
        .select()
        .from(addresses)
        .where(eq(addresses.id, shipment.billingAddressId))
        .limit(1) : Promise.resolve([])
    ]);

    const [shippingAddressResult, billingAddressResult] = addressQueries;
    const shippingAddress = shippingAddressResult[0];
    const billingAddress = billingAddressResult[0];

    // Get packages for storage breakdown
    const packageQuery = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        warehouseId: packages.warehouseId,
        receivedAt: packages.receivedAt,
        description: packages.description,
        weightActualKg: packages.weightActualKg
      })
      .from(shipmentPackages)
      .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(eq(shipmentPackages.shipmentId, shipmentId));

    // Get current storage fee breakdown
    const storageBreakdown = await StorageFeeCalculator.calculateStorageFees({
      packages: packageQuery,
      tenantId: userWithProfile.customerProfile.tenantId
    });

    // Prepare rate breakdown if available
    let rateBreakdown = null;
    if (shipment.rateCalculationDetails) {
      const details = shipment.rateCalculationDetails as any;
      rateBreakdown = {
        baseRate: parseFloat(shipment.baseShippingRate || '0'),
        weightCharge: parseFloat(shipment.weightShippingRate || '0'),
        minChargeApplied: details.breakdown?.minChargeApplied || false,
        chargeableWeightKg: details.breakdown?.chargeableWeightKg || parseFloat(shipment.totalWeightKg || '0'),
        zoneName: details.zoneName
      };
    }

    const checkoutData = {
      shipment: {
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        status: shipment.status,
        serviceType: shipment.serviceType,
        totalWeightKg: parseFloat(shipment.totalWeightKg || '0'),
        quoteExpiresAt: shipment.quoteExpiresAt?.toISOString(),
        packageCount: packageQuery.length,
        packages: packageQuery.map(pkg => ({
          id: pkg.id,
          internalId: pkg.internalId,
          description: pkg.description,
          weight: parseFloat(pkg.weightActualKg?.toString() || '0'),
          receivedAt: pkg.receivedAt?.toISOString()
        })),
        costs: {
          shipping: parseFloat(shipment.shippingCost || '0'),
          insurance: parseFloat(shipment.insuranceCost || '0'),
          handling: parseFloat(shipment.handlingFee || '0'),
          storage: parseFloat(shipment.storageFee || '0'),
          total: parseFloat(shipment.totalCost || '0'),
          currency: shipment.costCurrency || 'USD'
        },
        rateBreakdown,
        storageBreakdown: storageBreakdown.breakdown
      },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress, // Use shipping address as fallback
    };

    // Create payment intent for Stripe Elements if shipment is ready for payment
  let clientSecret = null;
  if (shipment.status === 'quoted' && 
      (!shipment.quoteExpiresAt || new Date() <= new Date(shipment.quoteExpiresAt))) {
    
    // Calculate current storage fees (they may have changed since quote)
    const packageQuery = await db
      .select({
        id: packages.id,
        warehouseId: packages.warehouseId,
        receivedAt: packages.receivedAt,
        weightActualKg: packages.weightActualKg
      })
      .from(shipmentPackages)
      .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(eq(shipmentPackages.shipmentId, shipmentId));

    const currentStorageFees = await StorageFeeCalculator.calculateStorageFees({
      packages: packageQuery,
      tenantId: userWithProfile.customerProfile.tenantId
    });

    const totalAmount = parseFloat(shipment.totalCost || '0') + 
                       (currentStorageFees.totalStorageFee - parseFloat(shipment.storageFee || '0'));

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: shipment.costCurrency?.toLowerCase() || 'usd',
      metadata: {
        shipmentId: shipment.id,
        customerProfileId: userWithProfile.customerProfile.id,
        tenantId: userWithProfile.customerProfile.tenantId
      },
      automatic_payment_methods: {
        enabled: true
      },
      description: `Shipping for ${shipment.shipmentNumber}`,
      receipt_email: userWithProfile.email
    });

    clientSecret = paymentIntent.client_secret;
  }

  // Add clientSecret and canPay to the response
  return NextResponse.json({
    ...checkoutData,
    clientSecret,
    shipment: {
      ...checkoutData.shipment,
      canPay: shipment.status === 'quoted' && 
              (!shipment.quoteExpiresAt || new Date() <= new Date(shipment.quoteExpiresAt))
    }
  });

  } catch (error) {
    console.error('Error fetching checkout data:', error);
    return NextResponse.json(
      { error: 'Failed to load checkout data' },
      { status: 500 }
    );
  }
}