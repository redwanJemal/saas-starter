// app/api/admin/expected-packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, customerProfiles, users } from '@/lib/db/schema';
import { eq, sql, ilike, and, or, SQL } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

// Helper function to convert dates to SQL format
function toSQLDate(date: string | Date | null): SQL<unknown> | null {
  if (!date) return null;
  const dateObj = date instanceof Date ? date : new Date(date);
  return sql`${dateObj.toISOString()}::timestamp`;
}

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('packages.read');

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'expected';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where conditions for expected packages
    let whereConditions = [
      eq(packages.status, status as any)
    ];

    if (search) {
      whereConditions.push(
        or(
          ilike(packages.trackingNumberInbound, `%${search}%`),
          ilike(packages.senderName, `%${search}%`),
          sql`${users.firstName} || ' ' || ${users.lastName} ILIKE ${`%${search}%`}`,
          ilike(users.email, `%${search}%`)
        )
      );
    }

    // Build the where clause safely
    let whereClause: SQL<unknown>;
    if (whereConditions.length === 0) {
      whereClause = sql`TRUE`;
    } else if (whereConditions.length === 1) {
      whereClause = whereConditions[0];
    } else {
      whereClause = whereConditions.reduce((acc, condition, index) => {
        return index === 1 ? and(whereConditions[0], condition) : and(acc, condition);
      });
    }

    // Get expected packages with customer info
    const expectedPackages = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        trackingNumberInbound: packages.trackingNumberInbound,
        senderName: packages.senderName,
        senderCompany: packages.senderCompany,
        description: packages.description,
        expectedArrivalDate: packages.expectedArrivalDate,
        status: packages.status,
        createdAt: packages.createdAt,
        // Customer fields
        customerId: customerProfiles.customerId,
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        suiteCode: packages.suiteCodeCaptured,
      })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(whereClause)
      .orderBy(packages.expectedArrivalDate, packages.createdAt)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(whereClause);

    // Transform to match expected format
    const transformedPackages = expectedPackages.map(pkg => ({
      id: pkg.id,
      customerId: pkg.customerId,
      retailerName: pkg.senderName || pkg.senderCompany || 'Unknown Retailer',
      expectedTrackingNo: pkg.trackingNumberInbound,
      expectedDate: pkg.expectedArrivalDate,
      status: pkg.status === 'expected' ? 'pending' : pkg.status,
      customerName: pkg.customerName,
      customerEmail: pkg.customerEmail,
      suiteCode: pkg.suiteCode,
      description: pkg.description,
      createdAt: pkg.createdAt
    }));

    return NextResponse.json({
      packages: transformedPackages,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching expected packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expected packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const adminUser = await requirePermission('packages.create');

    // Parse request body
    const {
      customerProfileId,
      warehouseId,
      trackingNumberInbound,
      senderName,
      senderCompany,
      description,
      expectedArrivalDate,
      estimatedValue,
      estimatedValueCurrency,
    } = await request.json();

    // Validate required fields
    if (!customerProfileId || !warehouseId) {
      return NextResponse.json({ error: 'Customer profile ID and warehouse ID are required' }, { status: 400 });
    }

    // Check if tracking number already exists
    const existingPackage = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.trackingNumberInbound, trackingNumberInbound))
      .limit(1);

    if (existingPackage.length > 0) {
      return NextResponse.json(
        { error: 'Package with this tracking number already exists' },
        { status: 409 }
      );
    }

    // Generate a unique internal ID for the package
    const internalId = `PKG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Create new expected package
    const [newPackage] = await db
      .insert(packages)
      .values({
        tenantId: adminUser.tenantId,
        customerProfileId,
        warehouseId,
        internalId,
        trackingNumberInbound,
        senderName: senderName || null,
        senderCompany: senderCompany || null,
        description: description || null,
        expectedArrivalDate: toSQLDate(expectedArrivalDate),
        estimatedValue: estimatedValue ? sql`${Number(estimatedValue)}` : null,
        estimatedValueCurrency: estimatedValueCurrency || 'USD',
        status: 'expected',
        createdAt: sql`now()`,
        updatedAt: sql`now()`
      })
      .returning({
        id: packages.id,
        trackingNumberInbound: packages.trackingNumberInbound,
        status: packages.status,
        createdAt: packages.createdAt
      });

    return NextResponse.json({
      message: 'Expected package created successfully',
      package: newPackage
    });

  } catch (error) {
    console.error('Error creating expected package:', error);
    return NextResponse.json(
      { error: 'Failed to create expected package' },
      { status: 500 }
    );
  }
}