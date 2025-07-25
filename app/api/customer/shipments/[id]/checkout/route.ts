// app/api/customer/shipments/[id]/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, addresses } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { stripe } from '@/lib/payments/stripe';
import { eq, and, or } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = params.id;

    // Get shipment details
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        quoteExpiresAt: shipments.quoteExpiresAt,
        shippingAddressId: shipments.shippingAddressId,
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

    // Validate shipment status
    if (shipment.status !== 'quoted') {
      return NextResponse.json(
        { error: 'Shipment must be quoted before checkout' },
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

    // Validate total cost
    if (!shipment.totalCost || parseFloat(shipment.totalCost) <= 0) {
      return NextResponse.json(
        { error: 'Invalid shipment cost' },
        { status: 400 }
      );
    }

    // Get shipping address for description
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
      amount: Math.round(parseFloat(shipment.totalCost) * 100), // Convert to cents
      currency: shipment.costCurrency?.toLowerCase() || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        customerId: userWithProfile.customerProfile.id,
        tenantId: userWithProfile.customerProfile.tenantId,
      },
      description: `Shipping for ${shipment.shipmentNumber} to ${destination}`,
      receipt_email: userWithProfile.email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: parseFloat(shipment.totalCost),
      currency: shipment.costCurrency || 'USD',
      shipment: {
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        destination,
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
  { params }: { params: { id: string } }
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipmentId = params.id;

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
    const addressQuery = await db
      .select({
        id: addresses.id,
        addressType: addresses.addressType,
        name: addresses.name,
        companyName: addresses.companyName,
        addressLine1: addresses.addressLine1,
        addressLine2: addresses.addressLine2,
        city: addresses.city,
        stateProvince: addresses.stateProvince,
        postalCode: addresses.postalCode,
        countryCode: addresses.countryCode,
        phone: addresses.phone,
        email: addresses.email,
      })
      .from(addresses)
      .where(
        or(
          eq(addresses.id, shipment.shippingAddressId || ''),
          eq(addresses.id, shipment.billingAddressId || '')
        )
      );

    const shippingAddress = addressQuery.find(addr => addr.id === shipment.shippingAddressId);
    const billingAddress = addressQuery.find(addr => addr.id === shipment.billingAddressId);

    // Parse rate calculation details
    let rateBreakdown = null;
    if (shipment.rateCalculationDetails) {
      try {
        rateBreakdown = JSON.parse(shipment.rateCalculationDetails as string);
      } catch (e) {
        console.warn('Failed to parse rate calculation details');
      }
    }

    return NextResponse.json({
      shipment: {
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        status: shipment.status,
        serviceType: shipment.serviceType,
        totalWeightKg: shipment.totalWeightKg ? parseFloat(shipment.totalWeightKg) : 0,
        quoteExpiresAt: shipment.quoteExpiresAt,
        costs: {
          shippingCost: shipment.shippingCost ? parseFloat(shipment.shippingCost) : 0,
          insuranceCost: shipment.insuranceCost ? parseFloat(shipment.insuranceCost) : 0,
          handlingFee: shipment.handlingFee ? parseFloat(shipment.handlingFee) : 0,
          storageFee: shipment.storageFee ? parseFloat(shipment.storageFee) : 0,
          totalCost: shipment.totalCost ? parseFloat(shipment.totalCost) : 0,
          currency: shipment.costCurrency || 'USD',
        },
        rateBreakdown,
      },
      shippingAddress,
      billingAddress,
    });
  } catch (error) {
    console.error('Error fetching checkout details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checkout details' },
      { status: 500 }
    );
  }
}