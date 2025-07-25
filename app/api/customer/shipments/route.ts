// app/api/customer/shipments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, shipmentPackages, packages, addresses } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, and, inArray, desc, sql, or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Build where conditions
    let whereConditions = [
      eq(shipments.customerProfileId, userWithProfile.customerProfile.id)
    ];

    if (search) {
      whereConditions.push(
        or(
          ilike(shipments.shipmentNumber, `%${search}%`),
          ilike(shipments.trackingNumber, `%${search}%`)
        )
      );
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(shipments.status, status));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 1 
      ? sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}`
      : whereConditions[0];

    // Get shipments with packages
    const shipmentsWithPackages = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        trackingNumber: shipments.trackingNumber,
        carrierCode: shipments.carrierCode,
        serviceType: shipments.serviceType,
        totalWeightKg: shipments.totalWeightKg,
        totalDeclaredValue: shipments.totalDeclaredValue,
        declaredValueCurrency: shipments.declaredValueCurrency,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        quoteExpiresAt: shipments.quoteExpiresAt,
        paidAt: shipments.paidAt,
        dispatchedAt: shipments.dispatchedAt,
        estimatedDeliveryDate: shipments.estimatedDeliveryDate,
        deliveredAt: shipments.deliveredAt,
        deliveryInstructions: shipments.deliveryInstructions,
        requiresSignature: shipments.requiresSignature,
        customsStatus: shipments.customsStatus,
        commercialInvoiceUrl: shipments.commercialInvoiceUrl,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        packageId: packages.id,
        packageTrackingNumber: packages.trackingNumberInbound,
        packageDescription: packages.description,
        packageStatus: packages.status,
        packageWeightKg: packages.weightActualKg,
        packageLengthCm: packages.lengthCm,
        packageWidthCm: packages.widthCm,
        packageHeightCm: packages.heightCm,
        packageEstimatedValue: packages.estimatedValue,
        packageEstimatedValueCurrency: packages.estimatedValueCurrency,
        packageSenderName: packages.senderName,
        packageIsFragile: packages.isFragile,
        packageIsHighValue: packages.isHighValue,
        packageRequiresAdultSignature: packages.requiresAdultSignature,
      })
      .from(shipments)
      .leftJoin(shipmentPackages, eq(shipments.id, shipmentPackages.shipmentId))
      .leftJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(whereClause)
      .orderBy(desc(shipments.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(distinct ${shipments.id})` })
      .from(shipments)
      .where(whereClause);

    // Group packages by shipment
    const shipmentsMap = new Map();
    
    shipmentsWithPackages.forEach((row) => {
      if (!shipmentsMap.has(row.id)) {
        shipmentsMap.set(row.id, {
          id: row.id,
          shipmentNumber: row.shipmentNumber,
          status: row.status,
          trackingNumber: row.trackingNumber,
          carrierCode: row.carrierCode,
          serviceType: row.serviceType,
          totalWeightKg: row.totalWeightKg ? parseFloat(row.totalWeightKg) : 0,
          totalDeclaredValue: row.totalDeclaredValue ? parseFloat(row.totalDeclaredValue) : 0,
          declaredValueCurrency: row.declaredValueCurrency,
          totalCost: row.totalCost ? parseFloat(row.totalCost) : null,
          costCurrency: row.costCurrency,
          quoteExpiresAt: row.quoteExpiresAt?.toISOString() || null,
          paidAt: row.paidAt?.toISOString() || null,
          dispatchedAt: row.dispatchedAt?.toISOString() || null,
          estimatedDeliveryDate: row.estimatedDeliveryDate || null,
          deliveredAt: row.deliveredAt?.toISOString() || null,
          deliveryInstructions: row.deliveryInstructions,
          requiresSignature: row.requiresSignature,
          customsStatus: row.customsStatus,
          commercialInvoiceUrl: row.commercialInvoiceUrl,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          packages: []
        });
      }

      if (row.packageId) {
        shipmentsMap.get(row.id).packages.push({
          id: row.packageId,
          trackingNumberInbound: row.packageTrackingNumber,
          description: row.packageDescription,
          status: row.packageStatus,
          weightActualKg: row.packageWeightKg ? parseFloat(row.packageWeightKg) : 0,
          lengthCm: row.packageLengthCm ? parseFloat(row.packageLengthCm) : 0,
          widthCm: row.packageWidthCm ? parseFloat(row.packageWidthCm) : 0,
          heightCm: row.packageHeightCm ? parseFloat(row.packageHeightCm) : 0,
          estimatedValue: row.packageEstimatedValue ? parseFloat(row.packageEstimatedValue) : 0,
          estimatedValueCurrency: row.packageEstimatedValueCurrency || 'USD',
          senderName: row.packageSenderName || '',
          isFragile: row.packageIsFragile || false,
          isHighValue: row.packageIsHighValue || false,
          requiresAdultSignature: row.packageRequiresAdultSignature || false,
        });
      }
    });

    const shipmentsWithDetails = Array.from(shipmentsMap.values());

    return NextResponse.json({
      shipments: shipmentsWithDetails,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customer shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      packageIds,
      shippingAddressId,
      billingAddressId,
      serviceType = 'standard',
      declaredValue,
      declaredValueCurrency = 'USD',
      deliveryInstructions = '',
      requiresSignature = false,
    } = body;

    // Validate required fields
    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json(
        { error: 'Package IDs are required' },
        { status: 400 }
      );
    }

    if (!shippingAddressId) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Verify packages belong to customer and are ready to ship
    const customerPackages = await db
      .select()
      .from(packages)
      .where(
        and(
          inArray(packages.id, packageIds),
          eq(packages.customerProfileId, userWithProfile.customerProfile.id),
          eq(packages.status, 'ready_to_ship')
        )
      );

    if (customerPackages.length !== packageIds.length) {
      return NextResponse.json(
        { error: 'Some packages are not available for shipping' },
        { status: 400 }
      );
    }

    // Verify shipping address belongs to customer
    const [shippingAddress] = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, shippingAddressId),
          eq(addresses.customerProfileId, userWithProfile.customerProfile.id)
        )
      );

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Invalid shipping address' },
        { status: 400 }
      );
    }

    // Verify billing address if provided
    if (billingAddressId && billingAddressId !== 'none') {
      const [billingAddress] = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.id, billingAddressId),
            eq(addresses.customerProfileId, userWithProfile.customerProfile.id)
          )
        );

      if (!billingAddress) {
        return NextResponse.json(
          { error: 'Invalid billing address' },
          { status: 400 }
        );
      }
    }

    // Calculate shipment totals
    const totalWeight = customerPackages.reduce(
      (sum, pkg) => sum + (pkg.weightActualKg ? parseFloat(pkg.weightActualKg) : 0),
      0
    );

    const totalDeclaredValue = declaredValue || customerPackages.reduce(
      (sum, pkg) => sum + (pkg.estimatedValue ? parseFloat(pkg.estimatedValue) : 0),
      0
    );

    // Generate shipment number
    const shipmentNumber = `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Get customer's warehouse (use first package's warehouse)
    const warehouseId = customerPackages[0].warehouseId;

    // Ensure UUID fields are properly handled
    const shipmentData = {
      tenantId: userWithProfile.customerProfile.tenantId,
      customerProfileId: userWithProfile.customerProfile.id,
      warehouseId: warehouseId,
      shipmentNumber,
      shippingAddressId,
      billingAddressId: (billingAddressId && billingAddressId !== 'none') ? billingAddressId : null,
      // Remove companyId as it's causing the UUID error - it should be null if not provided
      serviceType,
      totalWeightKg: totalWeight.toString(),
      totalDeclaredValue: totalDeclaredValue.toString(),
      declaredValueCurrency,
      deliveryInstructions,
      requiresSignature,
      status: 'quote_requested',
      customsStatus: 'pending',
    };

    // Create shipment
    const [newShipment] = await db
      .insert(shipments)
      .values(shipmentData)
      .returning();

    // Link packages to shipment
    await db.insert(shipmentPackages).values(
      packageIds.map((packageId: string) => ({
        shipmentId: newShipment.id,
        packageId,
      }))
    );

    // Update package status
    await db
      .update(packages)
      .set({
        status: 'processing',
        updatedAt: sql`now()`,
      })
      .where(inArray(packages.id, packageIds));

    return NextResponse.json({
      shipment: {
        id: newShipment.id,
        shipmentNumber: newShipment.shipmentNumber,
        status: newShipment.status,
        message: 'Shipment created successfully. You will receive a quote shortly.',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}