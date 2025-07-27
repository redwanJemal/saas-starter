// app/api/admin/shipping-rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shippingRates, zones, warehouses } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/admin';
import { eq, and, desc, sql, or, ilike, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.read');
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Search and filter parameters
    const search = searchParams.get('search') || '';
    const warehouseId = searchParams.get('warehouse_id');
    const zoneId = searchParams.get('zone_id');
    const serviceType = searchParams.get('service_type');
    const isActive = searchParams.get('is_active');

    // Build where conditions
    let whereConditions = [
      eq(shippingRates.tenantId, adminUser.tenantId)
    ];

    if (search) {
      whereConditions.push(
        or(
          ilike(warehouses.name, `%${search}%`),
          ilike(zones.name, `%${search}%`),
          ilike(shippingRates.serviceType, `%${search}%`)
        )
      );
    }

    if (warehouseId && warehouseId !== 'all') {
      whereConditions.push(eq(shippingRates.warehouseId, warehouseId));
    }

    if (zoneId && zoneId !== 'all') {
      whereConditions.push(eq(shippingRates.zoneId, zoneId));
    }

    if (serviceType && serviceType !== 'all') {
      whereConditions.push(eq(shippingRates.serviceType, serviceType as any));
    }

    if (isActive && isActive !== 'all') {
      whereConditions.push(eq(shippingRates.isActive, isActive === 'true'));
    }

    // Get shipping rates with joined data
    const ratesQuery = await db
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
      .where(and(...whereConditions))
      .orderBy(desc(shippingRates.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shippingRates)
      .leftJoin(warehouses, eq(shippingRates.warehouseId, warehouses.id))
      .leftJoin(zones, eq(shippingRates.zoneId, zones.id))
      .where(and(...whereConditions));

    const totalPages = Math.ceil(count / limit);

    // Format the response
    const formattedRates = ratesQuery.map(rate => ({
      ...rate,
      baseRate: parseFloat(rate.baseRate),
      perKgRate: parseFloat(rate.perKgRate),
      minCharge: parseFloat(rate.minCharge),
      maxWeightKg: rate.maxWeightKg ? parseFloat(rate.maxWeightKg) : null,
    }));

    return NextResponse.json({
      rates: formattedRates,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('admin.create');
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

    // Check for overlapping active rates
    let overlapConditions = [
      eq(shippingRates.tenantId, adminUser.tenantId),
      eq(shippingRates.warehouseId, warehouseId),
      eq(shippingRates.zoneId, zoneId),
      eq(shippingRates.serviceType, serviceType),
      eq(shippingRates.isActive, true),
      lte(shippingRates.effectiveFrom, effectiveFrom),
    ];

    if (effectiveUntil) {
      overlapConditions.push(
        or(
          eq(shippingRates.effectiveUntil, null),
          gte(shippingRates.effectiveUntil, effectiveFrom)
        )
      );
    } else {
      overlapConditions.push(
        or(
          eq(shippingRates.effectiveUntil, null),
          gte(shippingRates.effectiveUntil, effectiveFrom)
        )
      );
    }

    const overlappingRates = await db
      .select()
      .from(shippingRates)
      .where(and(...overlapConditions))
      .limit(1);

    if (overlappingRates.length > 0) {
      return NextResponse.json(
        { error: 'A rate for this warehouse-zone-service combination already exists for the specified date range' },
        { status: 400 }
      );
    }

    // Create shipping rate
    const [newRate] = await db
      .insert(shippingRates)
      .values({
        tenantId: adminUser.tenantId,
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
      })
      .returning();

    return NextResponse.json({
      message: 'Shipping rate created successfully',
      rate: {
        ...newRate,
        baseRate: parseFloat(newRate.baseRate),
        perKgRate: parseFloat(newRate.perKgRate),
        minCharge: parseFloat(newRate.minCharge),
        maxWeightKg: newRate.maxWeightKg ? parseFloat(newRate.maxWeightKg) : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating shipping rate:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping rate' },
      { status: 500 }
    );
  }
}