// app/api/customer/shipments/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  shipments, 
  packages, 
  shipmentPackages, 
  addresses, 
  warehouses,
  customerProfiles
} from '@/lib/db/schema';
import { eq, inArray, and, sql } from 'drizzle-orm';
import { getUserWithProfile } from '@/lib/db/queries';
import { ShippingRateCalculator } from '@/lib/services/shipping-rate-calculator';
import { StorageFeeCalculator } from '@/lib/services/storage-fee-calculator';

// Generate unique shipment number
async function generateShipmentNumber(): Promise<string> {
  const prefix = 'SH';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      packageIds,
      shippingAddressId,
      billingAddressId,
      serviceType = 'standard',
      declaredValue,
      declaredValueCurrency = 'USD',
      deliveryInstructions,
      requiresSignature = false,
      autoCalculateRates = true // Enable auto-calculation by default
    } = body;

    // Validation
    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one package is required' },
        { status: 400 }
      );
    }

    if (!shippingAddressId) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Verify all packages belong to the customer and are ready to ship
    const packageQuery = await db
      .select({
        id: packages.id,
        status: packages.status,
        warehouseId: packages.warehouseId,
        weightActualKg: packages.weightActualKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        volumetricWeightKg: packages.volumetricWeightKg,
        chargeableWeightKg: packages.chargeableWeightKg,
        estimatedValue: packages.estimatedValue,
        receivedAt: packages.receivedAt,
        internalId: packages.internalId,
      })
      .from(packages)
      .where(
        and(
          inArray(packages.id, packageIds),
          eq(packages.customerProfileId, userWithProfile.customerProfile.id),
          eq(packages.status, 'ready_to_ship')
        )
      );

    if (packageQuery.length !== packageIds.length) {
      return NextResponse.json(
        { error: 'Some packages are not available for shipping' },
        { status: 400 }
      );
    }

    // Verify all packages are from the same warehouse
    const warehouseIds = [...new Set(packageQuery.map(pkg => pkg.warehouseId))];
    if (warehouseIds.length > 1) {
      return NextResponse.json(
        { error: 'All packages must be from the same warehouse' },
        { status: 400 }
      );
    }
    const warehouseId = warehouseIds[0];

    // Verify shipping address belongs to customer
    const shippingAddress = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, shippingAddressId),
          eq(addresses.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (shippingAddress.length === 0) {
      return NextResponse.json(
        { error: 'Invalid shipping address' },
        { status: 400 }
      );
    }

    // Calculate total chargeable weight
    const totalChargeableWeight = packageQuery.reduce((total, pkg) => {
      // Use pre-calculated chargeable weight if available
      if (pkg.chargeableWeightKg) {
        return total + parseFloat(pkg.chargeableWeightKg.toString());
      }

      // Calculate chargeable weight (max of actual weight and volumetric weight)
      const actualWeight = pkg.weightActualKg ? parseFloat(pkg.weightActualKg.toString()) : 0;
      let volumetricWeight = 0;

      if (pkg.lengthCm && pkg.widthCm && pkg.heightCm) {
        const length = parseFloat(pkg.lengthCm.toString());
        const width = parseFloat(pkg.widthCm.toString());
        const height = parseFloat(pkg.heightCm.toString());
        volumetricWeight = (length * width * height) / 5000; // Standard volumetric calculation
      }

      return total + Math.max(actualWeight, volumetricWeight);
    }, 0);

    // Generate shipment number
    const shipmentNumber = await generateShipmentNumber();

    // Initialize cost variables
    let shippingCost = 0;
    let baseShippingRate = 0;
    let weightShippingRate = 0;
    let rateCalculationDetails = null;
    let rateCalculation = null;
    let shipmentStatus = 'quote_requested'; // Default to manual quote

    // Attempt automatic rate calculation
    if (autoCalculateRates) {
      try {
        rateCalculation = await ShippingRateCalculator.calculateRate({
          warehouseId,
          destinationCountry: shippingAddress[0].countryCode,
          totalChargeableWeightKg: totalChargeableWeight,
          serviceType: serviceType as 'standard' | 'express' | 'economy',
          tenantId: userWithProfile.customerProfile.tenantId
        });

        if (rateCalculation.success && rateCalculation.rate) {
          shippingCost = rateCalculation.rate.totalShippingCost;
          baseShippingRate = rateCalculation.rate.baseRate;
          weightShippingRate = rateCalculation.rate.weightCharge;
          rateCalculationDetails = {
            zoneId: rateCalculation.rate.id,
            zoneName: rateCalculation.rate.zoneName,
            breakdown: rateCalculation.rate.breakdown,
            calculatedAt: new Date().toISOString()
          };
          shipmentStatus = 'quoted'; // Auto-quote successful
        }
      } catch (error) {
        console.error('Rate calculation failed:', error);
        // Continue with manual quote process
      }
    }

    // Calculate storage fees for all packages
    const storageFeeResult = await StorageFeeCalculator.calculateStorageFees({
      packages: packageQuery,
      tenantId: userWithProfile.customerProfile.tenantId
    });
    const storageFee = storageFeeResult.totalStorageFee;

    // Calculate total cost
    const insuranceCost = 0; // TODO: Implement insurance calculation
    const handlingFee = 0; // TODO: Implement handling fee calculation based on package count/type
    const totalCost = shippingCost + insuranceCost + handlingFee + storageFee;

    // Create shipment record
    const [newShipment] = await db
      .insert(shipments)
      .values({
        tenantId: userWithProfile.customerProfile.tenantId,
        customerProfileId: userWithProfile.customerProfile.id,
        warehouseId,
        shipmentNumber,
        shippingAddressId,
        billingAddressId: billingAddressId || shippingAddressId,
        serviceType,
        totalWeightKg: totalChargeableWeight.toString(),
        totalDeclaredValue: declaredValue?.toString(),
        declaredValueCurrency,
        shippingCost: shippingCost.toString(),
        insuranceCost: insuranceCost.toString(),
        handlingFee: handlingFee.toString(),
        storageFee: storageFee.toString(),
        totalCost: totalCost.toString(),
        costCurrency: 'USD', // TODO: Make configurable
        baseShippingRate: baseShippingRate.toString(),
        weightShippingRate: weightShippingRate.toString(),
        rateCalculationDetails,
        requiresSignature,
        deliveryInstructions,
        status: 'quote_requested', // Explicitly set the status to a valid enum value
        createdBy: userWithProfile.id,
        quoteExpiresAt: shipmentStatus === 'quoted' 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          : null
      })
      .returning();

    // Link packages to shipment
    const shipmentPackageValues = packageQuery.map(pkg => ({
      shipmentId: newShipment.id,
      packageId: pkg.id,
      declaredValue: declaredValue ? (declaredValue / packageQuery.length).toString() : null,
      declaredDescription: `Package ${pkg.internalId}`
    }));

    await db.insert(shipmentPackages).values(shipmentPackageValues);

    // Keep packages as ready_to_ship until payment is complete
    // They will be updated to 'shipped' after successful payment

    // Prepare response data
    const responseData = {
      shipment: {
        id: newShipment.id,
        shipmentNumber: newShipment.shipmentNumber,
        status: newShipment.status,
        totalWeightKg: totalChargeableWeight,
        packageCount: packageQuery.length,
        costs: {
          shipping: shippingCost,
          insurance: insuranceCost,
          handling: handlingFee,
          storage: storageFee,
          total: totalCost,
          currency: 'USD'
        },
        destination: {
          countryCode: shippingAddress[0].countryCode,
          city: shippingAddress[0].city,
          name: shippingAddress[0].name
        },
        quoteExpiresAt: newShipment.quoteExpiresAt?.toISOString(),
        storageBreakdown: storageFeeResult.breakdown
      },
      rateCalculation: rateCalculation?.success ? rateCalculation.rate : null,
      canProceedToPayment: shipmentStatus === 'quoted' && totalCost > 0,
      nextSteps: shipmentStatus === 'quoted' 
        ? ['review_quote', 'proceed_to_payment']
        : ['await_manual_quote', 'admin_will_provide_quote']
    };

    return NextResponse.json({
      message: shipmentStatus === 'quoted' 
        ? 'Shipment created with automatic quote - ready for payment!'
        : 'Shipment created - quote will be provided by our team',
      ...responseData
    });

  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}