// app/api/customer/shipments/create/route.ts

import { db } from '@/lib/db/drizzle';
import { 
  shipments, 
  shipmentPackages, 
  packages, 
  addresses,
  customerProfiles 
} from '@/lib/db/schema';
import { ShippingRateCalculator } from '@/lib/services/shipping-rate-calculator';
import { getUserWithProfile } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { StorageFeeCalculator } from '@/lib/services/storage-fee-calculator';
import { generateShipmentNumber } from '@/lib/utils/id-generator';

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
      companyId,
      serviceType = 'standard',
      declaredValue,
      declaredValueCurrency = 'USD',
      requiresSignature = false,
      deliveryInstructions,
      autoCalculateRates = true
    } = body;

    // Validate required fields
    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one package must be selected' },
        { status: 400 }
      );
    }

    if (!shippingAddressId) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Verify packages belong to customer and are ready to ship
    const packageQuery = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        status: packages.status,
        warehouseId: packages.warehouseId,
        weightActualKg: packages.weightActualKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        chargeableWeightKg: packages.chargeableWeightKg,
        receivedAt: packages.receivedAt
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
        { error: 'Some packages are not found or not ready to ship' },
        { status: 400 }
      );
    }

    // Verify all packages are from the same warehouse
    const warehouseIds = [...new Set(packageQuery.map(p => p.warehouseId))];
    if (warehouseIds.length > 1) {
      return NextResponse.json(
        { error: 'All packages must be from the same warehouse' },
        { status: 400 }
      );
    }

    const warehouseId = warehouseIds[0];

    // Get shipping address for rate calculation
    const addressQuery = await db
      .select({
        id: addresses.id,
        countryCode: addresses.countryCode,
        city: addresses.city,
        name: addresses.name
      })
      .from(addresses)
      .where(eq(addresses.id, shippingAddressId))
      .limit(1);

    if (addressQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipping address not found' },
        { status: 400 }
      );
    }

    const shippingAddress = addressQuery[0];

    // Calculate total chargeable weight
    const totalChargeableWeight = packageQuery.reduce((total, pkg) => {
      if (pkg.chargeableWeightKg) {
        return total + parseFloat(pkg.chargeableWeightKg);
      }
      // Calculate on the fly if not pre-calculated
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
    // const shipmentNumber = await generateShipmentNumber(userWithProfile.customerProfile.tenantId);
    const shipmentNumber = await generateShipmentNumber();

    // Calculate shipping rate if auto-calculation is enabled
    let rateCalculation = null;
    let shippingCost = 0;
    let baseShippingRate = 0;
    let weightShippingRate = 0;
    let rateCalculationDetails = null;

    if (autoCalculateRates) {
      rateCalculation = await ShippingRateCalculator.calculateRate({
        warehouseId,
        destinationCountry: shippingAddress.countryCode,
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
        billingAddressId,
        companyId,
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
        rateCalculationDetails: rateCalculationDetails,
        requiresSignature,
        deliveryInstructions,
        createdBy: userWithProfile.id,
        status: autoCalculateRates && rateCalculation?.success ? 'quoted' : 'quote_requested',
        quoteExpiresAt: autoCalculateRates && rateCalculation?.success 
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

    // Update package status to 'shipped' (or keep as ready_to_ship until payment)
    // For now, keep packages as ready_to_ship until payment is complete
    
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
          countryCode: shippingAddress.countryCode,
          city: shippingAddress.city,
          name: shippingAddress.name
        },
        quoteExpiresAt: newShipment.quoteExpiresAt?.toISOString(),
        storageBreakdown: storageFeeResult.breakdown
      },
      rateCalculation: rateCalculation?.success ? rateCalculation.rate : null,
      canProceedToPayment: autoCalculateRates && rateCalculation?.success && totalCost > 0,
      nextSteps: autoCalculateRates && rateCalculation?.success 
        ? ['review_quote', 'proceed_to_payment']
        : ['wait_for_manual_quote']
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}