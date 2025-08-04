// app/api/admin/shipments/[id]/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, packages, shipmentPackages, addresses } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/admin';
import { eq, and, sum } from 'drizzle-orm';
import { ShippingRateCalculator } from '@/lib/services/shipping-rate-calculator';
import { StorageFeeCalculator } from '@/lib/services/storage-fee-calculator';
import { RouteContext } from '@/lib/utils/route';

export async function POST(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check admin permissions
    const adminUser = await requirePermission('shipments.manage');
    const shipmentId = (await RouteContext.params).id;
    const body = await request.json();

    const {
      carrierCode,
      carrierName,
      serviceType = 'standard',
      trackingNumber,
      shippingCost,
      insuranceCost = 0,
      handlingFee = 0,
      costCurrency = 'USD',
      estimatedDeliveryDays,
      notes,
      autoCalculateRates = false, // Whether to auto-calculate or use manual values
    } = body;

    // Get shipment details
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        warehouseId: shipments.warehouseId,
        shippingAddressId: shipments.shippingAddressId,
        customerProfileId: shipments.customerProfileId,
        status: shipments.status,
        totalWeightKg: shipments.totalWeightKg,
        tenantId: shipments.tenantId,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.status, 'quote_requested')
        )
      )
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found or cannot be quoted' },
        { status: 404 }
      );
    }

    const shipment = shipmentQuery[0];

    // Get shipping address for rate calculation
    const addressQuery = await db
      .select({
        countryCode: addresses.countryCode,
      })
      .from(addresses)
      .where(eq(addresses.id, shipment.shippingAddressId || ''))
      .limit(1);

    if (addressQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipping address not found' },
        { status: 400 }
      );
    }

    const shippingAddress = addressQuery[0];

    // Get packages for storage fee calculation
    const packagesQuery = await db
      .select({
        id: packages.id,
        warehouseId: packages.warehouseId,
        receivedAt: packages.receivedAt,
        weightActualKg: packages.weightActualKg,
        chargeableWeightKg: packages.chargeableWeightKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
      })
      .from(shipmentPackages)
      .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(eq(shipmentPackages.shipmentId, shipmentId));

    if (packagesQuery.length === 0) {
      return NextResponse.json(
        { error: 'No packages found for this shipment' },
        { status: 400 }
      );
    }

    // Calculate total chargeable weight
    let totalChargeableWeight = 0;
    if (autoCalculateRates) {
      totalChargeableWeight = packagesQuery.reduce((total, pkg) => {
        if (pkg.chargeableWeightKg) {
          return total + parseFloat(pkg.chargeableWeightKg.toString());
        }
        
        // Calculate chargeable weight from actual weight and volumetric weight
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
    }

    let calculatedShippingCost = shippingCost;
    let baseShippingRate = 0;
    let weightShippingRate = 0;
    let rateCalculationDetails = null;

    // Auto-calculate rates if requested
    if (autoCalculateRates) {
      const rateResult = await ShippingRateCalculator.calculateRate({
        warehouseId: shipment.warehouseId,
        destinationCountry: shippingAddress.countryCode,
        totalChargeableWeightKg: totalChargeableWeight,
        serviceType: serviceType as 'standard' | 'express' | 'economy',
        tenantId: shipment.tenantId,
      });

      if (!rateResult.success) {
        return NextResponse.json(
          { error: rateResult.error || 'Failed to calculate shipping rate' },
          { status: 400 }
        );
      }

      if (rateResult.rate) {
        calculatedShippingCost = rateResult.rate.totalShippingCost;
        baseShippingRate = rateResult.rate.baseRate;
        weightShippingRate = rateResult.rate.weightCharge;
        rateCalculationDetails = {
          zoneId: rateResult.rate.id,
          zoneName: rateResult.rate.zoneName,
          breakdown: rateResult.rate.breakdown,
          calculatedAt: new Date().toISOString(),
        };
      }
    } else {
      // Manual rates validation
      if (!carrierCode || !carrierName || calculatedShippingCost === undefined) {
        return NextResponse.json(
          { error: 'Carrier code, carrier name, and shipping cost are required for manual quotes' },
          { status: 400 }
        );
      }
    }

    // Calculate storage fees
    const storageFeeResult = await StorageFeeCalculator.calculateStorageFees({
      packages: packagesQuery,
      tenantId: shipment.tenantId,
    });

    const storageFee = storageFeeResult.totalStorageFee;

    // Calculate total cost
    const totalCost = parseFloat(calculatedShippingCost.toString()) + 
                     parseFloat(insuranceCost.toString()) + 
                     parseFloat(handlingFee.toString()) + 
                     storageFee;

    // Set quote expiry (e.g., 7 days from now)
    const quoteExpiresAt = new Date();
    quoteExpiresAt.setDate(quoteExpiresAt.getDate() + 7);

    // Set estimated delivery date if provided
    let estimatedDeliveryDate = null;
    if (estimatedDeliveryDays) {
      estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + parseInt(estimatedDeliveryDays));
    }

    // Update shipment with quote details
    const [updatedShipment] = await db
      .update(shipments)
      .set({
        status: 'quoted',
        carrierCode: carrierCode || null,
        serviceType,
        trackingNumber: trackingNumber || null,
        shippingCost: calculatedShippingCost.toString(),
        insuranceCost: insuranceCost.toString(),
        handlingFee: handlingFee.toString(),
        storageFee: storageFee.toString(),
        totalCost: totalCost.toString(),
        costCurrency,
        baseShippingRate: baseShippingRate.toString(),
        weightShippingRate: weightShippingRate.toString(),
        rateCalculationDetails,
        quoteExpiresAt,
        estimatedDeliveryDate: estimatedDeliveryDate?.toISOString(),
        processedBy: adminUser.id,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    // Return the updated shipment with breakdown
    return NextResponse.json({
      success: true,
      message: 'Quote generated successfully',
      shipment: {
        id: updatedShipment.id,
        shipmentNumber: updatedShipment.shipmentNumber,
        status: updatedShipment.status,
        serviceType: updatedShipment.serviceType,
        carrierCode: updatedShipment.carrierCode,
        trackingNumber: updatedShipment.trackingNumber,
        costBreakdown: {
          shipping: parseFloat(calculatedShippingCost.toString()),
          insurance: parseFloat(insuranceCost.toString()),
          handling: parseFloat(handlingFee.toString()),
          storage: storageFee,
          total: totalCost,
          currency: costCurrency,
        },
        rateDetails: rateCalculationDetails,
        storageBreakdown: storageFeeResult.breakdown,
        quoteExpiresAt: updatedShipment.quoteExpiresAt?.toISOString(),
        estimatedDeliveryDate: updatedShipment.estimatedDeliveryDate?.toString(),
      },
      notes,
    });
  } catch (error) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check admin permissions
    await requirePermission('shipments.read');
    const shipmentId = (await RouteContext.params).id;

    // Get available services for this shipment
    const shipmentQuery = await db
      .select({
        warehouseId: shipments.warehouseId,
        shippingAddressId: shipments.shippingAddressId,
        tenantId: shipments.tenantId,
      })
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (shipmentQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    const shipment = shipmentQuery[0];

    // Get shipping address
    const addressQuery = await db
      .select({
        countryCode: addresses.countryCode,
      })
      .from(addresses)
      .where(eq(addresses.id, shipment.shippingAddressId || ''))
      .limit(1);

    if (addressQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipping address not found' },
        { status: 400 }
      );
    }

    const shippingAddress = addressQuery[0];

    // Calculate total chargeable weight for the shipment
    const totalChargeableWeight = await ShippingRateCalculator.calculateChargeableWeightFromShipment(shipmentId);

    // Get available services
    const availableServices = await ShippingRateCalculator.getAvailableServices({
      warehouseId: shipment.warehouseId,
      destinationCountry: shippingAddress.countryCode,
      totalChargeableWeightKg: totalChargeableWeight,
      tenantId: shipment.tenantId,
    });

    return NextResponse.json({
      availableServices: availableServices.availableServices,
      totalChargeableWeight,
      destinationCountry: shippingAddress.countryCode,
    });
  } catch (error) {
    console.error('Error fetching available services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available services' },
      { status: 500 }
    );
  }
}