// app/api/admin/packages/assignment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { 
  incomingShipmentItems, 
  incomingShipments, 
  couriers, 
  customerProfiles,
  packages 
} from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { requirePermission } from '@/lib/auth/admin'

// Get unassigned items for assignment interface
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('packages.read')

    const searchParams = request.nextUrl.searchParams
    const incomingShipmentId = searchParams.get('incoming_shipment_id')
    const assignmentStatus = searchParams.get('assignment_status') || 'unassigned'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build where conditions
    let whereConditions = [
      eq(incomingShipmentItems.assignmentStatus, assignmentStatus as any)
    ]

    if (incomingShipmentId) {
      whereConditions.push(eq(incomingShipmentItems.incomingShipmentId, incomingShipmentId))
    }

    if (search) {
      whereConditions.push(
        sql`${incomingShipmentItems.trackingNumber} ILIKE ${`%${search}%`}`
      )
    }

    // Combine conditions
    const whereClause = whereConditions.reduce((acc, condition) => 
      sql`${acc} AND ${condition}`
    )

    // Get tracking items with shipment info
    const items = await db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        scannedAt: incomingShipmentItems.scannedAt,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        assignedAt: incomingShipmentItems.assignedAt,
        batchReference: incomingShipments.batchReference,
        courierName: couriers.name,
      })
      .from(incomingShipmentItems)
      .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(whereClause)
      .orderBy(incomingShipmentItems.scannedAt)
      .limit(limit)
      .offset(offset)

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incomingShipmentItems)
      .where(whereClause)

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching assignment items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment items' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requirePermission('packages.manage');
    const body = await request.json();
    const { itemId, status } = body;

    if (!itemId || !status) {
      return NextResponse.json(
        { error: 'Item ID and status are required' },
        { status: 400 }
      );
    }

    // Update the assigned item status
    const [updatedItem] = await db
      .update(incomingShipmentItems)
      .set({
        assignmentStatus: status,
        updatedAt: new Date()
      })
      .where(eq(incomingShipmentItems.id, itemId))
      .returning();

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: `Item status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating assigned item:', error);
    return NextResponse.json(
      { error: 'Failed to update assigned item' },
      { status: 500 }
    );
  }
}

// Bulk assign packages to customers
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage')

    const body = await request.json()
    const { assignments } = body

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: 'Assignments array is required' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    // Process each assignment
    for (const assignment of assignments) {
      const { itemId, customerProfileId } = assignment

      if (!itemId || !customerProfileId) {
        errors.push({
          itemId,
          error: 'Item ID and customer profile ID are required'
        })
        continue
      }

      try {
        // Verify the item exists and is unassigned
        const [item] = await db
          .select({
            id: incomingShipmentItems.id,
            trackingNumber: incomingShipmentItems.trackingNumber,
            assignmentStatus: incomingShipmentItems.assignmentStatus
          })
          .from(incomingShipmentItems)
          .where(eq(incomingShipmentItems.id, itemId))
          .limit(1)

        if (!item) {
          errors.push({
            itemId,
            error: 'Item not found'
          })
          continue
        }

        if (item.assignmentStatus === 'assigned') {
          errors.push({
            itemId,
            error: 'Item is already assigned'
          })
          continue
        }

        // Verify customer exists
        const [customer] = await db
          .select({
            id: customerProfiles.id,
            customerId: customerProfiles.customerId
          })
          .from(customerProfiles)
          .where(eq(customerProfiles.id, customerProfileId))
          .limit(1)

        if (!customer) {
          errors.push({
            itemId,
            error: 'Customer not found'
          })
          continue
        }

        // Update the assignment
        const [updatedItem] = await db
          .update(incomingShipmentItems)
          .set({
            assignmentStatus: 'assigned',
            assignedCustomerProfileId: customerProfileId,
            assignedAt: sql`now()`,
            assignedBy: adminUser.id,
            updatedAt: sql`now()`,
          })
          .where(eq(incomingShipmentItems.id, itemId))
          .returning()

        results.push({
          itemId,
          trackingNumber: item.trackingNumber,
          customerProfileId,
          customerId: customer.customerId,
          assignedAt: updatedItem.assignedAt,
          success: true
        })

        // TODO: Send notification to customer that their package has arrived
        // This would be implemented in a separate notification service

      } catch (error) {
        console.error(`Error assigning item ${itemId}:`, error)
        errors.push({
          itemId,
          error: 'Failed to assign item'
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${assignments.length} assignments`,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    })
  } catch (error) {
    console.error('Error processing package assignments:', error)
    return NextResponse.json(
      { error: 'Failed to process assignments' },
      { status: 500 }
    )
  }
}

// Bulk unassign packages
export async function DELETE(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage')

    const body = await request.json()
    const { itemIds } = body

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Item IDs array is required' },
        { status: 400 }
      )
    }

    // Update items to unassigned status
    const updatedItems = await db
      .update(incomingShipmentItems)
      .set({
        assignmentStatus: 'unassigned',
        assignedCustomerProfileId: null,
        assignedAt: null,
        assignedBy: null,
        updatedAt: sql`now()`,
      })
      .where(inArray(incomingShipmentItems.id, itemIds))
      .returning({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber
      })

    return NextResponse.json({
      message: `Successfully unassigned ${updatedItems.length} items`,
      items: updatedItems,
    })
  } catch (error) {
    console.error('Error unassigning packages:', error)
    return NextResponse.json(
      { error: 'Failed to unassign packages' },
      { status: 500 }
    )
  }
}