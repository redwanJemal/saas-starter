// app/api/admin/packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, customerProfiles, users, warehouses, incomingShipmentItems, incomingShipments, couriers, packageStatusHistory } from '@/lib/db/schema';
import { eq, and, ilike, or, sql, desc, count as countFn } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { generatePackageInternalId } from '@/lib/utils/id-generator';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('packages.read');

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const warehouseId = searchParams.get('warehouseId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions: any[] = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(packages.internalId, `%${search}%`),
          ilike(packages.trackingNumberInbound, `%${search}%`),
          ilike(packages.description, `%${search}%`),
          ilike(packages.senderName, `%${search}%`),
          sql`${users.firstName} || ' ' || ${users.lastName} ILIKE ${`%${search}%`}`,
          ilike(users.email, `%${search}%`),
          ilike(customerProfiles.customerId, `%${search}%`)
        )
      );
    }

    if (status) {
      whereConditions.push(eq(packages.status, status as any));
    }

    if (warehouseId) {
      whereConditions.push(eq(packages.warehouseId, warehouseId));
    }

    // Build final where clause
    const whereClause = whereConditions.length > 0 
      ? whereConditions.reduce((acc, condition) => acc ? and(acc, condition) : condition, null)
      : undefined;

    // Get packages with customer and warehouse info
    const packagesQuery = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        trackingNumberInbound: packages.trackingNumberInbound,
        status: packages.status,
        senderName: packages.senderName,
        description: packages.description,
        weightActualKg: packages.weightActualKg,
        chargeableWeightKg: packages.chargeableWeightKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        volumetricWeightKg: packages.volumetricWeightKg,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
        receivedAt: packages.receivedAt,
        readyToShipAt: packages.readyToShipAt,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
        // Customer info
        customerId: customerProfiles.customerId,
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        // Warehouse info
        warehouseName: warehouses.name,
        // Courier info
        courierName: couriers.name,
        batchReference: incomingShipments.batchReference,
      })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(warehouses, eq(packages.warehouseId, warehouses.id))
      .leftJoin(incomingShipmentItems, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
      .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(whereClause)
      .orderBy(desc(packages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: countFn() })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(warehouses, eq(packages.warehouseId, warehouses.id))
      .where(whereClause);

    // Format packages to ensure proper number handling
    const formattedPackages = packagesQuery.map(pkg => ({
      id: pkg.id,
      internalId: pkg.internalId,
      trackingNumberInbound: pkg.trackingNumberInbound || '',
      status: pkg.status,
      senderName: pkg.senderName || '',
      description: pkg.description || '',
      weightActualKg: pkg.weightActualKg ? parseFloat(pkg.weightActualKg.toString()) : null,
      chargeableWeightKg: pkg.chargeableWeightKg ? parseFloat(pkg.chargeableWeightKg.toString()) : null,
      lengthCm: pkg.lengthCm ? parseFloat(pkg.lengthCm.toString()) : null,
      widthCm: pkg.widthCm ? parseFloat(pkg.widthCm.toString()) : null,
      heightCm: pkg.heightCm ? parseFloat(pkg.heightCm.toString()) : null,
      volumetricWeightKg: pkg.volumetricWeightKg ? parseFloat(pkg.volumetricWeightKg.toString()) : null,
      estimatedValue: pkg.estimatedValue ? parseFloat(pkg.estimatedValue.toString()) : null,
      estimatedValueCurrency: pkg.estimatedValueCurrency || 'USD',
      receivedAt: pkg.receivedAt?.toISOString() || null,
      readyToShipAt: pkg.readyToShipAt?.toISOString() || null,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
      customerId: pkg.customerId,
      customerName: pkg.customerName,
      customerEmail: pkg.customerEmail,
      warehouseName: pkg.warehouseName || '',
      courierName: pkg.courierName || '',
      batchReference: pkg.batchReference || '',
    }));

    const totalPages = Math.ceil(Number(count) / limit);

    return NextResponse.json({
      packages: formattedPackages,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('packages.create');
    const body = await request.json();

    const {
      customerProfileId,
      warehouseId,
      trackingNumberInbound,
      senderName,
      senderCompany,
      description,
      weightActualKg,
      lengthCm,
      widthCm,
      heightCm,
      estimatedValue,
      estimatedValueCurrency = 'USD',
      expectedArrivalDate,
      warehouseNotes,
      customerNotes,
      specialInstructions,
      isFragile = false,
      isHighValue = false,
      requiresAdultSignature = false,
      isRestricted = false,
      sessionId, // For document attachment
    } = body;

    // Validate required fields
    if (!customerProfileId || !warehouseId || !trackingNumberInbound) {
      return NextResponse.json(
        { error: 'Customer profile ID, warehouse ID, and tracking number are required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await db.query.customerProfiles.findFirst({
      where: eq(customerProfiles.id, customerProfileId),
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify warehouse exists
    const warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, warehouseId),
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Calculate volumetric weight if dimensions are provided
    let volumetricWeightKg = null;
    if (lengthCm && widthCm && heightCm) {
      // Standard air freight divisor: 6000 for cm³ to kg
      volumetricWeightKg = (parseFloat(lengthCm) * parseFloat(widthCm) * parseFloat(heightCm)) / 6000;
    }

    // Calculate chargeable weight (higher of actual or volumetric)
    let chargeableWeightKg = null;
    if (weightActualKg || volumetricWeightKg) {
      const actualWeight = weightActualKg ? parseFloat(weightActualKg) : 0;
      const volWeight = volumetricWeightKg || 0;
      chargeableWeightKg = Math.max(actualWeight, volWeight);
    }

    // Generate internal ID
    const internalId = generatePackageInternalId();

    const formattedExpectedArrivalDate = expectedArrivalDate 
  ? new Date(expectedArrivalDate).toISOString().split('T')[0] // YYYY-MM-DD format
  : undefined;

    // Create package
    const [newPackage] = await db
      .insert(packages)
      .values({
        tenantId: adminUser.tenantId,
        internalId,
        customerProfileId,
        warehouseId,
        trackingNumberInbound,
        senderName,
        senderCompany,
        description,
        weightActualKg: weightActualKg ? weightActualKg.toString() : null,
        chargeableWeightKg: chargeableWeightKg ? chargeableWeightKg.toString() : null,
        lengthCm: lengthCm ? lengthCm.toString() : null,
        widthCm: widthCm ? widthCm.toString() : null,
        heightCm: heightCm ? heightCm.toString() : null,
        volumetricWeightKg: volumetricWeightKg ? volumetricWeightKg.toString() : null,
        estimatedValue: estimatedValue ? estimatedValue.toString() : null,
        estimatedValueCurrency,
        expectedArrivalDate: formattedExpectedArrivalDate,
        warehouseNotes,
        customerNotes,
        specialInstructions,
        isFragile,
        isHighValue,
        requiresAdultSignature,
        isRestricted,
        status: 'expected',
        processedBy: adminUser.id,
      })
      .returning();

    // Create initial status history entry
    await db.insert(packageStatusHistory).values({
      packageId: newPackage.id,
      status: 'expected',
      notes: 'Package created',
      changedBy: adminUser.id,
      changeReason: 'package_creation',
    });

    // Handle document attachment if sessionId provided
    let documentsAttached = 0;
    if (sessionId) {
      try {
        const { DocumentUploadService } = await import('@/lib/services/documentUploadService');
        const uploadService = new DocumentUploadService();
        const result = await uploadService.convertTemporaryToPackageDocuments(
          sessionId,
          newPackage.id,
          'picture',
          adminUser.id
        );
        documentsAttached = result.documentCount || 0;
      } catch (docError) {
        console.error('Error attaching documents:', docError);
        // Don't fail the package creation if documents fail
      }
    }

    return NextResponse.json({
      success: true,
      package: {
        id: newPackage.id,
        internalId: newPackage.internalId,
        status: newPackage.status,
      },
      documentsAttached,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}