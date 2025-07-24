// app/api/admin/packages/assigned-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  incomingShipmentItems,
  incomingShipments,
  customerProfiles,
  users,
  warehouses,
  couriers,
  packages
} from '@/lib/db/schema';
import { eq, and, isNull, desc, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('packages.create');
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const warehouseId = searchParams.get('warehouseId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where conditions - Fixed: Proper condition handling
    let whereConditions = [
      eq(incomingShipmentItems.assignmentStatus, 'assigned'), // Must be assigned
      isNull(packages.id) // Must not already have a package created
    ];
    
    if (search) {
        const searchCondition = or(
          ilike(incomingShipmentItems.trackingNumber, `%${search}%`),
          ilike(sql<string>`${users.firstName} || ' ' || ${users.lastName}`, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(customerProfiles.customerId, `%${search}%`)
        );
        
        if (searchCondition) {  // Only push if it's not undefined
          whereConditions.push(searchCondition);
        }
    }

    if (warehouseId) {
      whereConditions.push(eq(incomingShipments.warehouseId, warehouseId));
    }

    // Fixed: Proper where clause construction
    const whereClause = whereConditions.length > 1 
      ? and(...whereConditions)
      : whereConditions[0];

    // Get assigned items that don't have packages yet - Fixed: Join with users table
    const assignedItems = await db
      .select({
        // Item info
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        assignedAt: incomingShipmentItems.assignedAt,
        scannedAt: incomingShipmentItems.scannedAt,
        description: incomingShipmentItems.description,
        weightKg: incomingShipmentItems.weightKg,
        lengthCm: incomingShipmentItems.lengthCm,
        widthCm: incomingShipmentItems.widthCm,
        heightCm: incomingShipmentItems.heightCm,
        estimatedValue: incomingShipmentItems.estimatedValue,
        estimatedValueCurrency: incomingShipmentItems.estimatedValueCurrency,
        
        // Customer info - Fixed: Use users table for name fields
        customerProfileId: customerProfiles.id,
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        
        // Shipment info
        batchReference: incomingShipments.batchReference,
        arrivalDate: incomingShipments.arrivalDate,
        warehouseId: incomingShipments.warehouseId,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        
        // Courier info
        courierId: couriers.id,
        courierName: couriers.name,
        courierCode: couriers.code,
      })
      .from(incomingShipmentItems)
      .innerJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .innerJoin(customerProfiles, eq(incomingShipmentItems.assignedCustomerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id)) // Fixed: Join with users table
      .innerJoin(warehouses, eq(incomingShipments.warehouseId, warehouses.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .leftJoin(packages, eq(packages.incomingShipmentItemId, incomingShipmentItems.id)) // Left join to check for existing packages
      .where(whereClause)
      .orderBy(desc(incomingShipmentItems.assignedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination - Fixed: Include users table join
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incomingShipmentItems)
      .innerJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .innerJoin(customerProfiles, eq(incomingShipmentItems.assignedCustomerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id)) // Fixed: Include users table join
      .leftJoin(packages, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
      .where(whereClause);

    return NextResponse.json({
      assignedItems,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching assigned items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned items' },
      { status: 500 }
    );
  }
}