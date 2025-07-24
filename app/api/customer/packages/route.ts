// app/api/customer/packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { packages, warehouses, incomingShipmentItems, incomingShipments, couriers } from '@/lib/db/schema';
import { eq, sql, ilike, and, or, desc, SQL } from 'drizzle-orm';
import { getUserWithProfile } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and customer profile
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json(
        { error: 'Unauthorized - Customer profile required' },
        { status: 401 }
      );
    }

    const customerId = userWithProfile.customerProfile.id;
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    // Validate pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(50, Math.max(1, limit)); // Max 50 items per page
    const offset = (validatedPage - 1) * validatedLimit;

    // Build where conditions
    let whereConditions: SQL[] = [
      eq(packages.customerProfileId, customerId)
    ];

    // Add search filter
    if (search.trim()) {
      whereConditions.push(
        or(
          ilike(packages.trackingNumberInbound, `%${search}%`),
          ilike(packages.senderName, `%${search}%`),
          ilike(packages.description, `%${search}%`),
          ilike(packages.internalId, `%${search}%`)
        )!
      );
    }

    // Add status filter
    if (status && status !== 'all') {
      whereConditions.push(eq(packages.status, status as any));
    }

    // Combine all conditions
    const whereClause = whereConditions.length > 1 
      ? whereConditions.reduce((acc, condition) => and(acc, condition)!)
      : whereConditions[0];

    // Get packages with related data
    const packagesQuery = db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        trackingNumberInbound: packages.trackingNumberInbound,
        status: packages.status,
        senderName: packages.senderName,
        description: packages.description,
        weightActualKg: packages.weightActualKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        volumetricWeightKg: packages.volumetricWeightKg,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
        expectedArrivalDate: packages.expectedArrivalDate,
        receivedAt: packages.receivedAt,
        readyToShipAt: packages.readyToShipAt,
        storageExpiresAt: packages.storageExpiresAt,
        warehouseNotes: packages.warehouseNotes,
        customerNotes: packages.customerNotes,
        specialInstructions: packages.specialInstructions,
        isFragile: packages.isFragile,
        isHighValue: packages.isHighValue,
        requiresAdultSignature: packages.requiresAdultSignature,
        isRestricted: packages.isRestricted,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
        // Warehouse info
        warehouseName: warehouses.name,
        // Courier tracking URL from incoming shipment item
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        // Batch reference from incoming shipment
        batchReference: incomingShipments.batchReference,
        courierName: couriers.name,
      })
      .from(packages)
      .leftJoin(warehouses, eq(packages.warehouseId, warehouses.id))
      .leftJoin(incomingShipmentItems, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
      .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(whereClause)
      .orderBy(desc(packages.createdAt))
      .limit(validatedLimit)
      .offset(offset);

    const packagesList = await packagesQuery;

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(whereClause);

    const [{ count }] = await countQuery;

    // Format the response data
    const formattedPackages = packagesList.map(pkg => ({
      id: pkg.id,
      internalId: pkg.internalId,
      trackingNumberInbound: pkg.trackingNumberInbound || '',
      status: pkg.status,
      senderName: pkg.senderName || '',
      description: pkg.description || '',
      weightActualKg: pkg.weightActualKg ? parseFloat(pkg.weightActualKg) : 0,
      lengthCm: pkg.lengthCm ? parseFloat(pkg.lengthCm) : 0,
      widthCm: pkg.widthCm ? parseFloat(pkg.widthCm) : 0,
      heightCm: pkg.heightCm ? parseFloat(pkg.heightCm) : 0,
      volumetricWeightKg: pkg.volumetricWeightKg ? parseFloat(pkg.volumetricWeightKg) : 0,
      estimatedValue: pkg.estimatedValue ? parseFloat(pkg.estimatedValue) : 0,
      estimatedValueCurrency: pkg.estimatedValueCurrency || 'USD',
      expectedArrivalDate: pkg.expectedArrivalDate || null,
      receivedAt: pkg.receivedAt?.toISOString() || null,
      readyToShipAt: pkg.readyToShipAt?.toISOString() || null,
      storageExpiresAt: pkg.storageExpiresAt?.toISOString() || null,
      warehouseNotes: pkg.warehouseNotes || '',
      customerNotes: pkg.customerNotes || '',
      specialInstructions: pkg.specialInstructions || '',
      isFragile: pkg.isFragile || false,
      isHighValue: pkg.isHighValue || false,
      requiresAdultSignature: pkg.requiresAdultSignature || false,
      isRestricted: pkg.isRestricted || false,
      warehouseName: pkg.warehouseName || '',
      courierTrackingUrl: pkg.courierTrackingUrl || '',
      batchReference: pkg.batchReference || '',
      courierName: pkg.courierName || '',
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(count / validatedLimit);

    return NextResponse.json({
      packages: formattedPackages,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: count,
        pages: totalPages,
      },
    });

  } catch (error) {
    console.error('Error fetching customer packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}