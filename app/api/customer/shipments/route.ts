// app/api/customer/shipments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { shipments, shipmentPackages, packages, addresses, warehouses, zones } from '@/lib/db/schema';
import { getUserWithProfile } from '@/lib/db/queries';
import { eq, inArray, sql, and, desc, ilike, or } from 'drizzle-orm';
import { packageStatusEnum, shipmentStatusEnum } from '@/lib/db/schema/enums';
import { ShippingRateCalculator } from '@/lib/services/shipping-rate-calculator';

// GET method for fetching shipments with pagination
export async function GET(request: NextRequest) {
  try {
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
    const validatedLimit = Math.min(50, Math.max(1, limit));
    const offset = (validatedPage - 1) * validatedLimit;

    // Build where conditions
    let whereConditions = [eq(shipments.customerProfileId, customerId)];

    // Add search filter
    if (search.trim()) {
      whereConditions.push(
        or(
          ilike(shipments.shipmentNumber, `%${search}%`),
          ilike(shipments.trackingNumber, `%${search}%`)
        )!
      );
    }

    // Add status filter
    if (status && status !== 'all') {
      whereConditions.push(eq(shipments.status, status as any));
    }

    // Combine all conditions
    const whereClause = whereConditions.length > 1 
      ? whereConditions.reduce((acc, condition) => and(acc, condition)!) 
      : whereConditions[0];

    // Get shipments with related data
    const shipmentsQuery = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        status: shipments.status,
        serviceType: shipments.serviceType,
        trackingNumber: shipments.trackingNumber,
        carrierCode: shipments.carrierCode,
        carrierReference: shipments.carrierReference,
        totalWeightKg: shipments.totalWeightKg,
        totalDeclaredValue: shipments.totalDeclaredValue,
        declaredValueCurrency: shipments.declaredValueCurrency,
        shippingCost: shipments.shippingCost,
        insuranceCost: shipments.insuranceCost,
        handlingFee: shipments.handlingFee,
        storageFee: shipments.storageFee,
        totalCost: shipments.totalCost,
        costCurrency: shipments.costCurrency,
        baseShippingRate: shipments.baseShippingRate,
        weightShippingRate: shipments.weightShippingRate,
        rateCalculationDetails: shipments.rateCalculationDetails,
        quoteExpiresAt: shipments.quoteExpiresAt,
        paidAt: shipments.paidAt,
        dispatchedAt: shipments.dispatchedAt,
        estimatedDeliveryDate: shipments.estimatedDeliveryDate,
        deliveredAt: shipments.deliveredAt,
        customsDeclaration: shipments.customsDeclaration,
        commercialInvoiceUrl: shipments.commercialInvoiceUrl,
        customsStatus: shipments.customsStatus,
        requiresSignature: shipments.requiresSignature,
        deliveryInstructions: shipments.deliveryInstructions,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        // Warehouse info
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        // Zone info
        zoneName: zones.name,
        // Address IDs
        shippingAddressId: shipments.shippingAddressId,
        billingAddressId: shipments.billingAddressId,
      })
      .from(shipments)
      .leftJoin(warehouses, eq(shipments.warehouseId, warehouses.id))
      .leftJoin(zones, eq(shipments.zoneId, zones.id))
      .where(whereClause)
      .orderBy(desc(shipments.createdAt))
      .limit(validatedLimit)
      .offset(offset);

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shipments)
      .where(whereClause);

    // Get unique address IDs from all shipments
    const allAddressIds = new Set<string>();
    shipmentsQuery.forEach(shipment => {
      if (shipment.shippingAddressId) allAddressIds.add(shipment.shippingAddressId);
      if (shipment.billingAddressId) allAddressIds.add(shipment.billingAddressId);
    });

    // Fetch all addresses in one query
    const addressesQuery = allAddressIds.size > 0 
      ? await db
          .select()
          .from(addresses)
          .where(inArray(addresses.id, Array.from(allAddressIds)))
      : [];

    // Create address map for quick lookup
    const addressesMap = new Map();
    addressesQuery.forEach(addr => {
      addressesMap.set(addr.id, {
        id: addr.id,
        name: addr.name,
        companyName: addr.companyName,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        stateProvince: addr.stateProvince,
        postalCode: addr.postalCode,
        countryCode: addr.countryCode,
        phone: addr.phone,
        email: addr.email,
        deliveryInstructions: addr.deliveryInstructions,
        isDefault: addr.isDefault,
        isVerified: addr.isVerified,
      });
    });

    // Get package counts for each shipment
    const shipmentIds = shipmentsQuery.map(s => s.id);
    const packageCountsQuery = shipmentIds.length > 0 
      ? await db
          .select({
            shipmentId: shipmentPackages.shipmentId,
            count: sql<number>`count(*)`
          })
          .from(shipmentPackages)
          .where(inArray(shipmentPackages.shipmentId, shipmentIds))
          .groupBy(shipmentPackages.shipmentId)
      : [];

    const packageCounts = new Map();
    packageCountsQuery.forEach(({ shipmentId, count }) => {
      packageCounts.set(shipmentId, count);
    });

    // Format shipments
    const formattedShipments = shipmentsQuery.map(shipment => ({
      id: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      serviceType: shipment.serviceType,
      trackingNumber: shipment.trackingNumber || '',
      carrierCode: shipment.carrierCode || '',
      carrierReference: shipment.carrierReference || '',
      totalWeightKg: shipment.totalWeightKg ? parseFloat(shipment.totalWeightKg) : 0,
      totalDeclaredValue: shipment.totalDeclaredValue ? parseFloat(shipment.totalDeclaredValue) : 0,
      declaredValueCurrency: shipment.declaredValueCurrency || 'USD',
      totalCost: shipment.totalCost ? parseFloat(shipment.totalCost) : 0,
      costCurrency: shipment.costCurrency || 'USD',
      quoteExpiresAt: shipment.quoteExpiresAt?.toISOString() || null,
      paidAt: shipment.paidAt?.toISOString() || null,
      dispatchedAt: shipment.dispatchedAt?.toISOString() || null,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate?.toString () || null,
      deliveredAt: shipment.deliveredAt?.toISOString() || null,
      deliveryInstructions: shipment.deliveryInstructions || '',
      requiresSignature: shipment.requiresSignature || false,
      customsStatus: shipment.customsStatus,
      createdAt: shipment.createdAt.toISOString(),
      updatedAt: shipment.updatedAt.toISOString(),
      warehouseName: shipment.warehouseName || '',
      warehouseCode: shipment.warehouseCode || '',
      zoneName: shipment.zoneName || '',
      packageCount: packageCounts.get(shipment.id) || 0,
      shippingAddress: shipment.shippingAddressId ? addressesMap.get(shipment.shippingAddressId) : null,
      billingAddress: shipment.billingAddressId ? addressesMap.get(shipment.billingAddressId) : null,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / validatedLimit);

    return NextResponse.json({
      shipments: formattedShipments,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: totalCount,
        pages: totalPages,
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

// POST method for creating shipments
export async function POST(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json(
        { error: 'Unauthorized - Customer profile required' },
        { status: 401 }
      );
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

    // Verify all packages exist and belong to the customer and are ready to ship
    const packagesQuery = await db
      .select({
        id: packages.id,
        status: packages.status,
        warehouseId: packages.warehouseId,
        weightActualKg: packages.weightActualKg,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
      })
      .from(packages)
      .where(
        and(
          inArray(packages.id, packageIds),
          eq(packages.customerProfileId, userWithProfile.customerProfile.id)
        )
      );

    if (packagesQuery.length !== packageIds.length) {
      return NextResponse.json(
        { error: 'Some packages not found or do not belong to you' },
        { status: 400 }
      );
    }

    // Check if all packages are ready to ship
    const invalidPackages = packagesQuery.filter(pkg => pkg.status !== 'ready_to_ship');
    if (invalidPackages.length > 0) {
      return NextResponse.json(
        { error: 'Some packages are not ready to ship' },
        { status: 400 }
      );
    }

    // Verify shipping address belongs to customer
    const addressQuery = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, shippingAddressId),
          eq(addresses.customerProfileId, userWithProfile.customerProfile.id),
          eq(addresses.addressType, 'shipping')
        )
      )
      .limit(1);

    if (addressQuery.length === 0) {
      return NextResponse.json(
        { error: 'Invalid shipping address' },
        { status: 400 }
      );
    }

    const shippingAddress = addressQuery[0];

    // Verify all packages are from the same warehouse
    const uniqueWarehouses = [...new Set(packagesQuery.map(p => p.warehouseId))];
    if (uniqueWarehouses.length > 1) {
      return NextResponse.json(
        { error: 'All packages must be from the same warehouse' },
        { status: 400 }
      );
    }

    const warehouseId = uniqueWarehouses[0];

    // Calculate total weight and declared value
    const totalWeight = packagesQuery.reduce(
      (sum, pkg) => sum + (pkg.weightActualKg ? parseFloat(pkg.weightActualKg) : 0),
      0
    );

    const totalDeclaredValue = declaredValue || packagesQuery.reduce(
      (sum, pkg) => sum + (pkg.estimatedValue ? parseFloat(pkg.estimatedValue) : 0),
      0
    );

    // Generate unique shipment number
    const shipmentNumber = `SH${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create shipment
    const [newShipment] = await db
      .insert(shipments)
      .values({
        tenantId: userWithProfile.customerProfile.tenantId,
        shipmentNumber,
        customerProfileId: userWithProfile.customerProfile.id,
        warehouseId,
        shippingAddressId,
        billingAddressId: billingAddressId || shippingAddressId,
        serviceType,
        status: 'quote_requested',
        totalWeightKg: totalWeight.toString(),
        totalDeclaredValue: totalDeclaredValue.toString(),
        declaredValueCurrency,
        deliveryInstructions,
        requiresSignature,
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .returning();

    // Link packages to shipment
    const shipmentPackageValues = packageIds.map(packageId => ({
      shipmentId: newShipment.id,
      packageId,
      addedAt: sql`now()`,
    }));

    await db.insert(shipmentPackages).values(shipmentPackageValues);

    // Update package status to 'shipping_requested'
    await db
      .update(packages)
      .set({
        status: packageStatusEnum.enumValues[2],
        updatedAt: sql`now()`,
      })
      .where(inArray(packages.id, packageIds));

      return NextResponse.json({
        message: 'Shipment created successfully',
        shipment: {
          id: newShipment.id,
          shipmentNumber: newShipment.shipmentNumber,
          status: newShipment.status,
        },
        // Add redirect information
        redirect: {
          url: `/dashboard/shipments/${newShipment.id}`,
          action: 'created', // This indicates the shipment was just created
        }
      });

  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}