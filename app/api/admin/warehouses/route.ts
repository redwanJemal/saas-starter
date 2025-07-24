// app/api/admin/warehouses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { warehouses, packages, shipments } from '@/lib/db/schema';
import { desc, eq, ilike, sql, count, or } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    if (search) {
      whereConditions.push(
        or(
          ilike(warehouses.name, `%${search}%`),
          ilike(warehouses.code, `%${search}%`),
          ilike(warehouses.city, `%${search}%`)
        )
      );
    }
    if (status) {
      whereConditions.push(eq(warehouses.status, status as any));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 ?
      sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` : undefined;

    // Get warehouses with stats
    const warehousesQuery = db
      .select({
        id: warehouses.id,
        name: warehouses.name,
        code: warehouses.code,
        status: warehouses.status,
        addressLine1: warehouses.addressLine1,
        city: warehouses.city,
        stateProvince: warehouses.stateProvince,
        countryCode: warehouses.countryCode,
        phone: warehouses.phone,
        email: warehouses.email,
        timezone: warehouses.timezone,
        currencyCode: warehouses.currencyCode,
        maxPackageWeightKg: warehouses.maxPackageWeightKg,
        maxPackageValue: warehouses.maxPackageValue,
        acceptsNewPackages: warehouses.acceptsNewPackages,
        createdAt: warehouses.createdAt,
      })
      .from(warehouses)
      .orderBy(desc(warehouses.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      warehousesQuery.where(whereClause);
    }

    const warehousesList = await warehousesQuery;

    // Get stats for each warehouse
    const warehousesWithStats = await Promise.all(
      warehousesList.map(async (warehouse) => {
        // Get package counts
        const [packageStats] = await db
          .select({
            totalPackages: count(),
            pendingPackages: sql<number>`COUNT(CASE WHEN status IN ('received', 'processing') THEN 1 END)`,
            readyPackages: sql<number>`COUNT(CASE WHEN status = 'ready_to_ship' THEN 1 END)`,
          })
          .from(packages)
          .where(eq(packages.warehouseId, warehouse.id));

        // Get shipment counts
        const [shipmentStats] = await db
          .select({
            totalShipments: count(),
            activeShipments: sql<number>`COUNT(CASE WHEN status IN ('processing', 'dispatched', 'in_transit') THEN 1 END)`,
          })
          .from(shipments)
          .where(eq(shipments.warehouseId, warehouse.id));

        return {
          ...warehouse,
          stats: {
            totalPackages: packageStats?.totalPackages || 0,
            pendingPackages: packageStats?.pendingPackages || 0,
            readyPackages: packageStats?.readyPackages || 0,
            totalShipments: shipmentStats?.totalShipments || 0,
            activeShipments: shipmentStats?.activeShipments || 0,
          }
        };
      })
    );

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(warehouses)
      .where(whereClause);

    return NextResponse.json({
      warehouses: warehousesWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.manage');

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'code', 'addressLine1', 'city', 'postalCode', 'countryCode', 'currencyCode'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if warehouse code already exists
    const existingWarehouse = await db
      .select({ id: warehouses.id })
      .from(warehouses)
      .where(eq(warehouses.code, body.code))
      .limit(1);

    if (existingWarehouse.length > 0) {
      return NextResponse.json(
        { error: 'Warehouse code already exists' },
        { status: 400 }
      );
    }

    // Create warehouse
    const [newWarehouse] = await db
      .insert(warehouses)
      .values({
        tenantId: adminUser.tenantId,
        name: body.name,
        code: body.code.toUpperCase(),
        description: body.description || null,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 || null,
        city: body.city,
        stateProvince: body.stateProvince || null,
        postalCode: body.postalCode,
        countryCode: body.countryCode,
        phone: body.phone || null,
        email: body.email || null,
        timezone: body.timezone || 'UTC',
        currencyCode: body.currencyCode,
        taxTreatment: body.taxTreatment || 'standard',
        storageFreeDays: body.storageFreeDays || 30,
        storageFeePerDay: body.storageFeePerDay || '1.00',
        maxPackageWeightKg: body.maxPackageWeightKg || '30.00',
        maxPackageValue: body.maxPackageValue || '10000.00',
        status: 'active',
        acceptsNewPackages: body.acceptsNewPackages !== false,
      })
      .returning();

    return NextResponse.json(newWarehouse, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}