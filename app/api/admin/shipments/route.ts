import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, customerProfiles, users, warehouses, addresses } from '@/lib/db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('shipments.read');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const warehouseId = searchParams.get('warehouse_id') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(shipments.id, `%${search}%`),
          ilike(shipments.trackingNumber, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    if (status) {
      whereConditions.push(eq(shipments.status, status as any));
    }

    if (warehouseId) {
      whereConditions.push(eq(shipments.warehouseId, warehouseId));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` 
      : undefined;

    // Get shipments with related data
    const shipmentsQuery = db
      .select({
        id: shipments.id,
        internalId: shipments.id,
        trackingNumber: shipments.trackingNumber,
        status: shipments.status,
        totalWeightKg: shipments.totalWeightKg,
        totalValue: shipments.totalDeclaredValue,
        valueCurrency: shipments.declaredValueCurrency,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        // shippingMethod: shipments.shipmentMethod,
        // carrierName: shipments.courierName,
        dispatchedAt: shipments.dispatchedAt,
        deliveredAt: shipments.deliveredAt,
        createdAt: shipments.createdAt,
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        shippingCity: addresses.city,
        shippingCountry: addresses.countryCode,
      })
      .from(shipments)
      .innerJoin(customerProfiles, eq(shipments.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .innerJoin(warehouses, eq(shipments.warehouseId, warehouses.id))
      .leftJoin(addresses, eq(shipments.shippingAddressId, addresses.id))
      .orderBy(desc(shipments.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      shipmentsQuery.where(whereClause);
    }

    const shipmentsList = await shipmentsQuery;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shipments)
      .innerJoin(customerProfiles, eq(shipments.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(whereClause);

    return NextResponse.json({
      shipments: shipmentsList,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}