// app/api/admin/assign-packages/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  incomingShipmentItems, 
  customerProfiles, 
  users,
  incomingShipments,
  warehouses,
  couriers 
} from '@/lib/db/schema';
import { eq, inArray, sql, and, ilike, or } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage');
    
    const body = await request.json();
    const { itemIds, customerProfileId } = body;

    // Validate input
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Item IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!customerProfileId) {
      return NextResponse.json(
        { error: 'Customer profile ID is required' },
        { status: 400 }
      );
    }

    // Verify customer exists - Fixed: Join with users table for name fields
    const [customer] = await db
      .select({ 
        id: customerProfiles.id, 
        customerId: customerProfiles.customerId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
      })
      .from(customerProfiles)
      .innerJoin(users, eq(customerProfiles.userId, users.id)) // Fixed: Join with users table
      .where(eq(customerProfiles.id, customerProfileId))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get all items to verify they exist and are unassigned
    const items = await db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        assignmentStatus: incomingShipmentItems.assignmentStatus
      })
      .from(incomingShipmentItems)
      .where(inArray(incomingShipmentItems.id, itemIds));

    // Check if all items exist
    if (items.length !== itemIds.length) {
      const foundIds = items.map(item => item.id);
      const missingIds = itemIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: `Items not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Check if any items are already assigned
    const alreadyAssigned = items.filter(item => item.assignmentStatus === 'assigned');
    if (alreadyAssigned.length > 0) {
      return NextResponse.json(
        { 
          error: `Some items are already assigned: ${alreadyAssigned.map(item => item.trackingNumber).join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Perform bulk assignment
    await db
      .update(incomingShipmentItems)
      .set({
        assignmentStatus: 'assigned',
        assignedCustomerProfileId: customerProfileId,
        assignedAt: sql`now()`,
        assignedBy: adminUser.id,
        updatedAt: sql`now()`,
      })
      .where(inArray(incomingShipmentItems.id, itemIds));

    // Get the updated items for response
    const updatedItems = await db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        assignedAt: incomingShipmentItems.assignedAt
      })
      .from(incomingShipmentItems)
      .where(inArray(incomingShipmentItems.id, itemIds));

    return NextResponse.json({
      message: `Successfully assigned ${updatedItems.length} items to ${customer.firstName || ''} ${customer.lastName || ''} (${customer.customerId})`,
      assignedItems: updatedItems,
      customer: {
        id: customer.id,
        customerId: customer.customerId,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        email: customer.email
      },
      assignedBy: adminUser.id,
      assignedAt: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error bulk assigning packages:', error);
    return NextResponse.json(
      { error: 'Failed to assign packages' },
      { status: 500 }
    );
  }
}

// Get unassigned items for bulk assignment interface
export async function GET(request: NextRequest) {
  try {
    await requirePermission('packages.manage');
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const warehouseId = searchParams.get('warehouseId') || '';
    const courierId = searchParams.get('courierId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where conditions - Fixed: Proper condition handling
    let whereConditions = [eq(incomingShipmentItems.assignmentStatus, 'unassigned')];
    
    if (search) {
      whereConditions.push(
        ilike(incomingShipmentItems.trackingNumber, `%${search}%`)
      );
    }
    
    if (warehouseId) {
      whereConditions.push(eq(incomingShipments.warehouseId, warehouseId));
    }
    
    if (courierId) {
      whereConditions.push(eq(incomingShipments.courierId, courierId));
    }

    // Fixed: Proper where clause construction
    const whereClause = whereConditions.length > 1 
      ? and(...whereConditions)
      : whereConditions[0];

    // Build query for unassigned items - Fixed: Use proper Drizzle joins
    const unassignedItems = await db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        scannedAt: incomingShipmentItems.scannedAt,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        // Shipment info
        batchReference: incomingShipments.batchReference,
        warehouseId: incomingShipments.warehouseId,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        courierId: incomingShipments.courierId,
        courierName: couriers.name,
        courierCode: couriers.code,
        arrivalDate: incomingShipments.arrivalDate,
      })
      .from(incomingShipmentItems)
      .innerJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(warehouses, eq(incomingShipments.warehouseId, warehouses.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(whereClause)
      .orderBy(sql`${incomingShipmentItems.scannedAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incomingShipmentItems)
      .innerJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .where(whereClause);

    return NextResponse.json({
      unassignedItems,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching unassigned items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unassigned items' },
      { status: 500 }
    );
  }
}