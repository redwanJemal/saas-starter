import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, customerProfiles, users, warehouses } from '@/lib/db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('packages.read');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const warehouseId = searchParams.get('warehouse') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(packages.internalId, `%${search}%`),
          ilike(packages.trackingNumberInbound, `%${search}%`),
          ilike(packages.senderName, `%${search}%`)
        )
      );
    }

    if (status) {
      whereConditions.push(eq(packages.status, status as any));
    }

    if (warehouseId) {
      whereConditions.push(eq(packages.warehouseId, warehouseId));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` 
      : undefined;

    // Get packages with related data
    const packagesQuery = db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        trackingNumberInbound: packages.trackingNumberInbound,
        senderName: packages.senderName,
        description: packages.description,
        status: packages.status,
        weightActualKg: packages.weightActualKg,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
        receivedAt: packages.receivedAt,
        createdAt: packages.createdAt,
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
      })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .innerJoin(warehouses, eq(packages.warehouseId, warehouses.id))
      .orderBy(desc(packages.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      packagesQuery.where(whereClause);
    }

    const packagesList = await packagesQuery;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(whereClause);

    return NextResponse.json({
      packages: packagesList,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}