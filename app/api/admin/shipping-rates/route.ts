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
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const warehouseId = searchParams.get('warehouse_id') || '';
    const zoneId = searchParams.get('zone_id') || '';
    const serviceType = searchParams.get('service_type') || '';
    const status = searchParams.get('status') || '';

    // Build where conditions
    let whereConditions = [
      eq(shippingRates.tenantId, adminUser.tenantId)
    ];

    if (warehouseId) {
      whereConditions.push(eq(shippingRates.warehouseId, warehouseId));
    }

    if (zoneId) {
      whereConditions.push(eq(shippingRates.zoneId, zoneId));
    }

    if (serviceType && serviceType !== 'all') {
      whereConditions.push(eq(shippingRates.serviceType as any, serviceType));
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(shippingRates.isActive, status === 'active'));
    }

    // Only get current/future rates
    const today = new Date().toISOString().split('T')[0];
    whereConditions.push(
      or(
        eq(shippingRates.effectiveUntil, null),
        gte(shippingRates.effectiveUntil, today)
      )
    );

    // Combine conditions
    const whereClause = whereConditions.length > 1 ? 
      and(...whereConditions) : whereConditions[0];

    // Get shipping rates with zone and warehouse info
    const ratesQuery = await db
      .select({
        id: shippingRates.id,
        warehouseId: shippingRates.warehouseId,
        zoneId: shippingRates.zoneId,
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
        // Zone info
        zoneName: zones.name,
        // Warehouse info
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
      })
      .from(shippingRates)
      .leftJoin(zones, eq(shippingRates.zoneId, zones.id))
      .leftJoin(warehouses, eq(shippingRates.warehouseId, warehouses.id))
      .where(whereClause)
      .orderBy(desc(shippingRates.effectiveFrom), warehouses.name, zones.name)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(shippingRates)
      .where(whereClause);

    const totalItems = totalCountQuery[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      rates: ratesQuery.map(rate => ({
        ...rate,
        baseRate: parseFloat(rate.baseRate || '0'),
        perKgRate: parseFloat(rate.perKgRate || '0'),
        minCharge: parseFloat(rate.minCharge || '0'),
        maxWeightKg: rate.maxWeightKg ? parseFloat(rate.maxWeightKg) : null,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
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
        effectiveUntil,
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