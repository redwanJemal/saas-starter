// app/api/customer/shipments/[id]/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, shipmentPackages, packages, addresses } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { ShippingRateCalculator } from '@/lib/services/shipping-rate-calculator';
import { eq, and, sum } from 'drizzle-orm';
import { RouteContext } from '@/lib/utils/route';

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
    const searchParams = request.nextUrl.searchParams;
    const serviceType = searchParams.get('service_type') || 'standard';

    // Get shipment details
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        warehouseId: shipments.warehouseId,
        shippingAddressId: shipments.shippingAddressId,
        status: shipments.status,
        totalWeightKg: shipments.totalWeightKg,
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

    // Get shipping address
    const addressQuery = await db
      .select({
        countryCode: addresses.countryCode,
        city: addresses.city,
        name: addresses.name,
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

    // Calculate total weight if not already set
    let totalWeight = shipment.totalWeightKg ? parseFloat(shipment.totalWeightKg) : 0;
    
    if (totalWeight <= 0) {
      const weightQuery = await db
        .select({
          totalWeight: sum(packages.weightActualKg),
        })
        .from(shipmentPackages)
        .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
        .where(eq(shipmentPackages.shipmentId, shipmentId))
        .groupBy();

      totalWeight = parseFloat(weightQuery[0]?.totalWeight || '0');
    }

    if (totalWeight <= 0) {
      return NextResponse.json(
        { error: 'No packages or weight information found for this shipment' },
        { status: 400 }
      );
    }

    // Get rate calculation
    const rateResult = await ShippingRateCalculator.calculateRate({
      warehouseId: shipment.warehouseId,
      destinationCountry: shippingAddress.countryCode,
      totalChargeableWeightKg: totalWeight,
      serviceType: serviceType as 'standard' | 'express' | 'economy',
      tenantId: userWithProfile.customerProfile.tenantId,
    });

    if (!rateResult.success) {
      return NextResponse.json(
        { error: rateResult.error },
        { status: 400 }
      );
    }

    // Get all available services for comparison
    const servicesResult = await ShippingRateCalculator.getAvailableServices({
      warehouseId: shipment.warehouseId,
      destinationCountry: shippingAddress.countryCode,
      totalChargeableWeightKg: totalWeight,
      tenantId: userWithProfile.customerProfile.tenantId,
    });

    return NextResponse.json({
      shipment: {
        id: shipment.id,
        totalWeightKg: totalWeight,
        destination: {
          countryCode: shippingAddress.countryCode,
          city: shippingAddress.city,
          name: shippingAddress.name,
        },
      },
      quote: rateResult.rate,
      availableServices: servicesResult.availableServices || [],
      quoteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
  } catch (error) {
    console.error('Error generating shipment quote:', error);
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    const { serviceType = 'standard' } = body;

    // Get shipment details
    const shipmentQuery = await db
      .select({
        id: shipments.id,
        warehouseId: shipments.warehouseId,
        shippingAddressId: shipments.shippingAddressId,
        status: shipments.status,
        totalWeightKg: shipments.totalWeightKg,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.customerProfileId, userWithProfile.customerProfile.id),
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

    // Calculate total weight if not already set
    let totalWeight = shipment.totalWeightKg ? parseFloat(shipment.totalWeightKg) : 0;
    
    if (totalWeight <= 0) {
      const weightQuery = await db
        .select({
          totalWeight: sum(packages.weightActualKg),
        })
        .from(shipmentPackages)
        .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
        .where(eq(shipmentPackages.shipmentId, shipmentId));

      totalWeight = parseFloat(weightQuery[0]?.totalWeight || '0');
    }

    if (totalWeight <= 0) {
      return NextResponse.json(
        { error: 'No packages or weight information found for this shipment' },
        { status: 400 }
      );
    }

    // Get rate calculation
    const rateResult = await ShippingRateCalculator.calculateRate({
      warehouseId: shipment.warehouseId,
      destinationCountry: shippingAddress.countryCode,
      totalChargeableWeightKg: totalWeight,
      serviceType: serviceType as 'standard' | 'express' | 'economy',
      tenantId: userWithProfile.customerProfile.tenantId,
    });

    if (!rateResult.success) {
      return NextResponse.json(
        { error: rateResult.error },
        { status: 400 }
      );
    }

    const rate = rateResult.rate!;

    // Find zone ID for the destination
    const zoneId = await ShippingRateCalculator.findZoneByCountry(
      userWithProfile.customerProfile.tenantId,
      shippingAddress.countryCode
    );

    // Update shipment with quote
    const quoteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [updatedShipment] = await db
      .update(shipments)
      .set({
        zoneId,
        serviceType,
        totalWeightKg: totalWeight.toString(),
        shippingCost: rate.totalShippingCost.toString(),
        totalCost: rate.totalShippingCost.toString(), // For now, shipping cost = total cost
        costCurrency: rate.currencyCode,
        baseShippingRate: rate.baseRate.toString(),
        weightShippingRate: rate.perKgRate.toString(),
        rateCalculationDetails: JSON.stringify(rate.breakdown),
        status: 'quoted',
        quoteExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    return NextResponse.json({
      message: 'Quote generated successfully',
      shipment: updatedShipment,
      quote: rate,
      quoteExpiresAt: quoteExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating shipment quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}