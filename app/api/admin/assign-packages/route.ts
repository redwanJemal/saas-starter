// app/api/admin/assign-packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { incomingShipmentItems, customerProfiles, users } from '@/lib/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.update');

    const body = await request.json();
    const { assignments } = body;

    // Validate input: assignments should be array of {itemId, customerProfileId}
    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: 'Assignments array is required' },
        { status: 400 }
      );
    }

    // Validate each assignment has required fields
    for (const assignment of assignments) {
      if (!assignment.itemId || !assignment.customerProfileId) {
        return NextResponse.json(
          { error: 'Each assignment must have itemId and customerProfileId' },
          { status: 400 }
        );
      }
    }

    const results = [];
    const errors = [];

    // Process each assignment
    for (const assignment of assignments) {
      try {
        // Verify the item exists and is unassigned
        const [item] = await db
          .select({
            id: incomingShipmentItems.id,
            trackingNumber: incomingShipmentItems.trackingNumber,
            assignmentStatus: incomingShipmentItems.assignmentStatus,
          })
          .from(incomingShipmentItems)
          .where(eq(incomingShipmentItems.id, assignment.itemId))
          .limit(1);

        if (!item) {
          errors.push({
            itemId: assignment.itemId,
            error: 'Item not found'
          });
          continue;
        }

        if (item.assignmentStatus !== 'unassigned') {
          errors.push({
            itemId: assignment.itemId,
            trackingNumber: item.trackingNumber,
            error: 'Item is already assigned'
          });
          continue;
        }

        // Verify customer profile exists
        const [customer] = await db
          .select({
            id: customerProfiles.id,
            customerId: customerProfiles.customerId,
          })
          .from(customerProfiles)
          .where(eq(customerProfiles.id, assignment.customerProfileId))
          .limit(1);

        if (!customer) {
          errors.push({
            itemId: assignment.itemId,
            trackingNumber: item.trackingNumber,
            error: 'Customer not found'
          });
          continue;
        }

        // Update the assignment
        const [updatedItem] = await db
          .update(incomingShipmentItems)
          .set({
            assignmentStatus: 'assigned',
            assignedCustomerProfileId: assignment.customerProfileId,
            assignedAt: sql`now()`,
            assignedBy: adminUser.id,
            updatedAt: sql`now()`,
          })
          .where(eq(incomingShipmentItems.id, assignment.itemId))
          .returning();

        results.push({
          itemId: assignment.itemId,
          trackingNumber: item.trackingNumber,
          customerProfileId: assignment.customerProfileId,
          customerId: customer.customerId,
          assignedAt: updatedItem.assignedAt,
          success: true
        });

        // TODO: Send notification to customer that their package has arrived
        // This would be implemented in a separate notification service

      } catch (error) {
        console.error(`Error assigning item ${assignment.itemId}:`, error);
        errors.push({
          itemId: assignment.itemId,
          error: 'Failed to assign item'
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${assignments.length} assignments`,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    });

  } catch (error) {
    console.error('Error processing package assignments:', error);
    return NextResponse.json(
      { error: 'Failed to process assignments' },
      { status: 500 }
    );
  }
}

// Bulk unassign packages
export async function DELETE(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.update');

    const body = await request.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Item IDs array is required' },
        { status: 400 }
      );
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
        trackingNumber: incomingShipmentItems.trackingNumber,
      });

    return NextResponse.json({
      message: `Successfully unassigned ${updatedItems.length} items`,
      items: updatedItems,
    });

  } catch (error) {
    console.error('Error unassigning packages:', error);
    return NextResponse.json(
      { error: 'Failed to unassign packages' },
      { status: 500 }
    );
  }
}