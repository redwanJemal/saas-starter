import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, customerProfiles, users, warehouses, packageStatusHistory } from '@/lib/db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin packages API called');
    
    // Add detailed error logging for auth
    let adminUser;
    try {
      adminUser = await requirePermission('packages.read');
      console.log('✅ Admin auth successful:', adminUser.email);
    } catch (authError) {
      console.error('❌ Admin auth failed:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError instanceof Error ? authError.message : 'Unknown auth error' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const warehouseId = searchParams.get('warehouse_id') || '';
    const offset = (page - 1) * limit;

    console.log('📊 Query parameters:', { page, limit, search, status, warehouseId });

    // Test basic database connection
    try {
      const testQuery = await db.select().from(packages).limit(1);
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown DB error' },
        { status: 500 }
      );
    }

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
    const whereClause = whereConditions.length > 0 ?
      whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`) : undefined;

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
    console.log('✅ Packages query successful, found:', packagesList.length, 'packages');

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(whereClause);

    console.log('✅ Count query successful, total:', count);

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
    console.error('❌ Unexpected error in admin packages API:', error);
    
    // Return detailed error information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Failed to fetch packages',
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.create');

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['customerProfileId', 'warehouseId', 'internalId', 'senderName', 'description', 'weightActualKg'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if internal ID already exists
    const existingPackage = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.internalId, body.internalId))
      .limit(1);

    if (existingPackage.length > 0) {
      return NextResponse.json(
        { error: 'Package with this internal ID already exists' },
        { status: 400 }
      );
    }

    // Verify customer and warehouse exist
    const [customer] = await db
      .select({ id: customerProfiles.id, tenantId: customerProfiles.tenantId })
      .from(customerProfiles)
      .where(eq(customerProfiles.id, body.customerProfileId))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 }
      );
    }

    const [warehouse] = await db
      .select({ id: warehouses.id, acceptsNewPackages: warehouses.acceptsNewPackages })
      .from(warehouses)
      .where(eq(warehouses.id, body.warehouseId))
      .limit(1);

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 400 }
      );
    }

    if (!warehouse.acceptsNewPackages) {
      return NextResponse.json(
        { error: 'Warehouse is not accepting new packages' },
        { status: 400 }
      );
    }

    // Create package
    const [newPackage] = await db
      .insert(packages)
      .values({
        tenantId: customer.tenantId,
        customerProfileId: body.customerProfileId,
        warehouseId: body.warehouseId,
        internalId: body.internalId,
        suiteCodeCaptured: body.suiteCodeCaptured || null,
        trackingNumberInbound: body.trackingNumberInbound || null,
        senderName: body.senderName,
        senderCompany: body.senderCompany || null,
        senderTrackingUrl: body.senderTrackingUrl || null,
        description: body.description,
        estimatedValue: body.estimatedValue || '0',
        estimatedValueCurrency: body.estimatedValueCurrency || 'USD',
        weightActualKg: body.weightActualKg,
        lengthCm: body.lengthCm || null,
        widthCm: body.widthCm || null,
        heightCm: body.heightCm || null,
        volumetricWeightKg: body.volumetricWeightKg || null,
        status: body.status || 'received',
        expectedArrivalDate: body.expectedArrivalDate || null,
        receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
        warehouseNotes: body.warehouseNotes || null,
        specialInstructions: body.specialInstructions || null,
        isFragile: body.isFragile || false,
        isHighValue: body.isHighValue || false,
        requiresAdultSignature: body.requiresAdultSignature || false,
        isRestricted: body.isRestricted || false,
        processedBy: adminUser.id,
        processedAt: new Date(),
      })
      .returning();

    // Create initial status history entry
    await db.insert(packageStatusHistory).values({
      packageId: newPackage.id,
      status: newPackage.status as any, // Type assertion to handle the enum type
      notes: 'Package registered and received at warehouse',
      changedBy: adminUser.id,
      changeReason: 'initial_registration',
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}