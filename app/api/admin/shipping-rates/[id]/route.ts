// app/api/admin/shipping-rates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shippingRates, zones, warehouses } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/admin';
import { eq, and, or, gte, lte } from 'drizzle-orm';
import { RouteContext } from '@/lib/utils/route';

export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.read');
    const rateId = (await RouteContext.params).id;

    // Get rate details with zone and warehouse info
    const rateQuery = await db
      .select({
        id: shippingRates.id,
        warehouseId: shippingRates.warehouseId,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        zoneId: shippingRates.zoneId,
        zoneName: zones.name,
        serviceType: shippingRates.serviceType,
        baseRate: shippingRates.baseRate,
        perKgRate: shippingRates.perKgRate,
        minCharge: shippingRates.minCharge,
        maxWeightKg: shippingRates.maxWeightKg,
        currencyCode: shippingRates.currencyCode,
        isActive: shippingRates.isActive,
        effectiveFrom: shippingRates.effectiveFrom,
        effectiveUntil: shippingRates.effectiveUntil,
        createdAt: shippingRates.createdAt,
        updatedAt: shippingRates.updatedAt,
      })
      .from(shippingRates)
      .leftJoin(warehouses, eq(shippingRates.warehouseId, warehouses.id))
      .leftJoin(zones, eq(shippingRates.zoneId, zones.id))
      .where(
        and(
          eq(shippingRates.id, rateId),
          eq(shippingRates.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (rateQuery.length === 0) {
      return NextResponse.json(
        { error: 'Shipping rate not found' },
        { status: 404 }
      );
    }

    const rate = rateQuery[0];

    return NextResponse.json({
      rate: {
        ...rate,
        baseRate: parseFloat(rate.baseRate),
        perKgRate: parseFloat(rate.perKgRate),
        minCharge: parseFloat(rate.minCharge),
        maxWeightKg: rate.maxWeightKg ? parseFloat(rate.maxWeightKg) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching shipping rate details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rate details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.update');
    const rateId = (await RouteContext.params).id;
    const body = await request.json();

    const {
      warehouseId,
      zoneId,
      serviceType,
      baseRate,
      perKgRate,
      minCharge,
      maxWeightKg,
      currencyCode = 'USD',
      isActive = true,
      effectiveFrom,
      effectiveUntil,
    } = body;

    // Validate required fields
    if (!warehouseId || !zoneId || !serviceType || 
        baseRate === undefined || perKgRate === undefined || 
        minCharge === undefined || !effectiveFrom) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate numeric values
    if (baseRate < 0 || perKgRate < 0 || minCharge < 0) {
      return NextResponse.json(
        { error: 'Rates cannot be negative' },
        { status: 400 }
      );
    }

    // Check if rate exists and belongs to tenant
    const existingRate = await db
      .select()
      .from(shippingRates)
      .where(
        and(
          eq(shippingRates.id, rateId),
          eq(shippingRates.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (existingRate.length === 0) {
      return NextResponse.json(
        { error: 'Shipping rate not found' },
        { status: 404 }
      );
    }

    // Check if warehouse and zone belong to tenant
    const warehouseQuery = await db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.id, warehouseId),
          eq(warehouses.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    const zoneQuery = await db
      .select()
      .from(zones)
      .where(
        and(
          eq(zones.id, zoneId),
          eq(zones.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (warehouseQuery.length === 0) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 400 }
      );
    }

    if (zoneQuery.length === 0) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 400 }
      );
    }

    // Check for overlapping active rates (excluding current rate)
    let overlapConditions = [
      eq(shippingRates.tenantId, adminUser.tenantId),
      eq(shippingRates.warehouseId, warehouseId),
      eq(shippingRates.zoneId, zoneId),
      eq(shippingRates.serviceType, serviceType),
      eq(shippingRates.isActive, true),
      // Exclude current rate from overlap check
      // Only check if the updated rate is being set to active
      ...(isActive ? [lte(shippingRates.effectiveFrom, effectiveFrom)] : []),
    ];

    // Add date range overlap check only if the rate is being set to active
    // if (isActive) {
    //   if (effectiveUntil) {
    //     overlapConditions.push(
    //       or(
    //         eq(shippingRates.effectiveUntil, null),
    //         gte(shippingRates.effectiveUntil, effectiveFrom)
    //       ) 
    //     );
    //   } else {
    //     overlapConditions.push(
    //       or(
    //         eq(shippingRates.effectiveUntil, null),
    //         gte(shippingRates.effectiveUntil, effectiveFrom)
    //       )
    //     );
    //   }

    //   const overlappingRates = await db
    //     .select()
    //     .from(shippingRates)
    //     .where(
    //       and(
    //         ...overlapConditions,
    //         // Exclude the current rate being updated
    //         // This allows updating the same rate without conflict
    //       )
    //     )
    //     .limit(1);

    //   // Only check for conflicts if there are other overlapping rates
    //   const hasConflict = overlappingRates.some(rate => rate.id !== rateId);
      
    //   if (hasConflict) {
    //     return NextResponse.json(
    //       { error: 'A rate for this warehouse-zone-service combination already exists for the specified date range' },
    //       { status: 400 }
    //     );
    //   }
    // }

    // Update shipping rate
    const [updatedRate] = await db
      .update(shippingRates)
      .set({
        warehouseId,
        zoneId,
        serviceType,
        baseRate: baseRate.toString(),
        perKgRate: perKgRate.toString(),
        minCharge: minCharge.toString(),
        maxWeightKg: maxWeightKg ? maxWeightKg.toString() : null,
        currencyCode,
        isActive,
        effectiveFrom,
        effectiveUntil: effectiveUntil || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(shippingRates.id, rateId),
          eq(shippingRates.tenantId, adminUser.tenantId)
        )
      )
      .returning();

    return NextResponse.json({
      message: 'Shipping rate updated successfully',
      rate: {
        ...updatedRate,
        baseRate: parseFloat(updatedRate.baseRate),
        perKgRate: parseFloat(updatedRate.perKgRate),
        minCharge: parseFloat(updatedRate.minCharge),
        maxWeightKg: updatedRate.maxWeightKg ? parseFloat(updatedRate.maxWeightKg) : null,
      },
    });
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping rate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.delete');
    const rateId = (await RouteContext.params).id;

    // Check if rate exists and belongs to tenant
    const existingRate = await db
      .select()
      .from(shippingRates)
      .where(
        and(
          eq(shippingRates.id, rateId),
          eq(shippingRates.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (existingRate.length === 0) {
      return NextResponse.json(
        { error: 'Shipping rate not found' },
        { status: 404 }
      );
    }

    // TODO: Check if rate is being used in any active shipments
    // For now, we'll allow deletion but in production you might want to:
    // 1. Check for active shipments using this rate
    // 2. Instead of hard delete, set isActive = false
    // 3. Or move to a soft delete pattern

    // Delete the shipping rate
    await db
      .delete(shippingRates)
      .where(
        and(
          eq(shippingRates.id, rateId),
          eq(shippingRates.tenantId, adminUser.tenantId)
        )
      );

    return NextResponse.json({
      message: 'Shipping rate deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shipping rate:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping rate' },
      { status: 500 }
    );
  }
}