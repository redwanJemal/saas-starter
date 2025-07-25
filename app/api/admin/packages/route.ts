// app/api/admin/packages/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  packages, 
  customerProfiles, 
  users, 
  warehouses, 
  packageStatusHistory,
  incomingShipmentItems 
} from '@/lib/db/schema';
import { desc, eq, and, or, ilike, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { calculateChargeableWeight, calculateVolumetricWeight } from '@/lib/utils/weight-calculator';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('packages.read');

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
          ilike(packages.internalId, `%${search}%`),
          ilike(packages.trackingNumberInbound, `%${search}%`),
          ilike(packages.description, `%${search}%`),
          ilike(customerProfiles.customerId, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    if (status) {
      // Ensure status is one of the valid enum values
      const validStatuses = [
        'expected', 'received', 'processing', 'ready_to_ship', 
        'shipped', 'delivered', 'returned', 'disposed', 'missing', 'damaged', 'held'
      ];
      
      if (validStatuses.includes(status)) {
        whereConditions.push(eq(packages.status, status as any));
      }
    }

    if (warehouseId) {
      whereConditions.push(eq(packages.warehouseId, warehouseId));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions)
      : undefined;

    // Get packages with related data - Use users table for firstName/lastName
    const packagesQuery = db
      .select({
        // Package fields
        id: packages.id,
        internalId: packages.internalId,
        suiteCodeCaptured: packages.suiteCodeCaptured,
        trackingNumberInbound: packages.trackingNumberInbound,
        senderName: packages.senderName,
        senderCompany: packages.senderCompany,
        senderTrackingUrl: packages.senderTrackingUrl,
        description: packages.description,
        estimatedValue: packages.estimatedValue,
        estimatedValueCurrency: packages.estimatedValueCurrency,
        weightActualKg: packages.weightActualKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        volumetricWeightKg: packages.volumetricWeightKg,
        chargeableWeightKg: packages.chargeableWeightKg,
        status: packages.status,
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
        processedAt: packages.processedAt,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
        
        // Customer info - Fixed: use users table for firstName/lastName
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        
        // Warehouse info
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        warehouseCity: warehouses.city,
        warehouseCountry: warehouses.countryCode,
      })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id)) // Join to users table
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
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .innerJoin(warehouses, eq(packages.warehouseId, warehouses.id))
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
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission  
    const adminUser = await requirePermission('packages.manage');
    
    const body = await request.json();
    const {
      incomingShipmentItemId,
      description,
      weightActualKg,
      lengthCm,
      widthCm,
      heightCm,
      estimatedValue,
      estimatedValueCurrency,
      warehouseNotes,
      specialInstructions,
      isFragile,
      isHighValue,
      requiresAdultSignature,
      isRestricted,
    } = body;

    // Get the assigned incoming shipment item
    const assignedItem = await db
      .select()
      .from(incomingShipmentItems)
      .where(eq(incomingShipmentItems.id, incomingShipmentItemId))
      .limit(1);

    if (!assignedItem.length) {
      return NextResponse.json(
        { error: 'Incoming shipment item not found' },
        { status: 404 }
      );
    }

    const item = assignedItem[0];

    if (!item.assignedCustomerProfileId) {
      return NextResponse.json(
        { error: 'Incoming shipment item is not assigned to a customer' },
        { status: 400 }
      );
    }

    // Check if package already exists for this incoming item
    const existingPackage = await db
      .select()
      .from(packages)
      .where(eq(packages.incomingShipmentItemId, incomingShipmentItemId))
      .limit(1);

    if (existingPackage.length) {
      return NextResponse.json(
        { error: 'Package already exists for this incoming shipment item' },
        { status: 409 }
      );
    }

    // Generate internal package ID
    const internalId = `PKG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Calculate volumetric weight if dimensions provided - Convert to string for decimal field
    let volumetricWeightKg: string | null = null;
    if (lengthCm && widthCm && heightCm) {
      const volumetricWeight = calculateVolumetricWeight(
        parseFloat(lengthCm.toString()),
        parseFloat(widthCm.toString()),
        parseFloat(heightCm.toString())
      );
      volumetricWeightKg = volumetricWeight.toFixed(3); // Convert to string with 3 decimal places
    }
    
    // Calculate chargeable weight (the higher of actual weight and volumetric weight)
    let chargeableWeightKg: string | null = null;
    if (weightActualKg || volumetricWeightKg) {
      const chargeableWeight = calculateChargeableWeight({
        weightActualKg,
        lengthCm,
        widthCm,
        heightCm,
        volumetricWeightKg
      });
      chargeableWeightKg = chargeableWeight.toFixed(3); // Convert to string with 3 decimal places
    }

    // Create the package - All numeric values converted to strings for decimal fields
    const [newPackage] = await db
      .insert(packages)
      .values({
        tenantId: adminUser.tenantId,
        customerProfileId: item.assignedCustomerProfileId,
        warehouseId: item.warehouseId,
        incomingShipmentItemId: incomingShipmentItemId,
        internalId,
        
        // Copy tracking info from incoming item
        trackingNumberInbound: item.trackingNumber,
        senderTrackingUrl: item.courierTrackingUrl,
        senderName: item.courierName, // Use courier name as sender initially
        
        // Package details
        description: description || 'Package received via incoming shipment',
        weightActualKg: weightActualKg ? weightActualKg.toString() : null,
        lengthCm: lengthCm ? lengthCm.toString() : null,
        widthCm: widthCm ? widthCm.toString() : null,
        heightCm: heightCm ? heightCm.toString() : null,
        volumetricWeightKg,
        chargeableWeightKg,
        estimatedValue: estimatedValue ? estimatedValue.toString() : '0',
        estimatedValueCurrency: estimatedValueCurrency || 'USD',
        
        // Processing details
        status: 'received', // Start with received status since it came from incoming
        receivedAt: sql`now()`,
        warehouseNotes,
        specialInstructions,
        isFragile: isFragile || false,
        isHighValue: isHighValue || false,
        requiresAdultSignature: requiresAdultSignature || false,
        isRestricted: isRestricted || false,
        processedBy: adminUser.id,
        processedAt: sql`now()`,
      })
      .returning();

    // Create status history entry
    await db
      .insert(packageStatusHistory)
      .values({
        packageId: newPackage.id,
        status: 'received',
        notes: 'Package created from assigned incoming shipment item',
        changedBy: adminUser.id,
        changeReason: 'package_creation',
      });

    // Update the incoming shipment item status to 'received'
    await db
      .update(incomingShipmentItems)
      .set({
        assignmentStatus: 'received',
        updatedAt: sql`now()`,
      })
      .where(eq(incomingShipmentItems.id, incomingShipmentItemId));

    return NextResponse.json({
      message: 'Package created successfully',
      package: newPackage,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}