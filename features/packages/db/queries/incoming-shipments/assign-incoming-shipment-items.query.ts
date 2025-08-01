// features/packages/db/queries/incoming-shipments/assign-incoming-shipment-items.query.ts

import { db } from '@/lib/db';
import { incomingShipmentItems, type IncomingShipmentItem, type ItemAssignmentStatus } from '@/features/packages/db/schema';
import { eq, and } from 'drizzle-orm';

export interface AssignIncomingShipmentItemsData {
  itemId: string;
  incomingShipmentId?: string;
  customerProfileId: string;
  assignedBy: string;
}

export interface AssignIncomingShipmentItemsResult {
  assignedItems: Array<{
    id: string;
    trackingNumber: string | null;
    assignedCustomerProfileId: string;
    assignedAt: string;
    assignedBy: string;
  }>;
  failed: Array<{
    itemId: string;
    error: string;
  }>;
}

/**
 * Assign multiple incoming shipment items to customers
 */
export async function assignIncomingShipmentItems(
  assignments: AssignIncomingShipmentItemsData[]
): Promise<AssignIncomingShipmentItemsResult> {
  const assignedItems: AssignIncomingShipmentItemsResult['assignedItems'] = [];
  const failed: AssignIncomingShipmentItemsResult['failed'] = [];

  return await db.transaction(async (tx) => {
    for (const assignment of assignments) {
      try {
        // First, check if the item exists and is not already assigned
        const [existingItem] = await tx
          .select()
          .from(incomingShipmentItems)
          .where(eq(incomingShipmentItems.id, assignment.itemId))
          .limit(1);

        if (!existingItem) {
          failed.push({
            itemId: assignment.itemId,
            error: 'Item not found',
          });
          continue;
        }

        if (existingItem.assignmentStatus === 'assigned' || existingItem.assignedCustomerProfileId) {
          failed.push({
            itemId: assignment.itemId,
            error: 'Item is already assigned to a customer',
          });
          continue;
        }

        // Update the item with assignment information
        const assignedAt = new Date();
        const [updatedItem] = await tx
          .update(incomingShipmentItems)
          .set({
            assignedCustomerProfileId: assignment.customerProfileId,
            assignedBy: assignment.assignedBy,
            assignedAt,
            assignmentStatus: 'assigned' as ItemAssignmentStatus,
            updatedAt: new Date(),
          })
          .where(eq(incomingShipmentItems.id, assignment.itemId))
          .returning();

        if (updatedItem) {
          assignedItems.push({
            id: updatedItem.id,
            trackingNumber: updatedItem.trackingNumber,
            assignedCustomerProfileId: updatedItem.assignedCustomerProfileId!,
            assignedAt: assignedAt.toISOString(),
            assignedBy: updatedItem.assignedBy!,
          });
        } else {
          failed.push({
            itemId: assignment.itemId,
            error: 'Failed to update item assignment',
          });
        }
      } catch (error) {
        console.error(`Error assigning item ${assignment.itemId}:`, error);
        failed.push({
          itemId: assignment.itemId,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    return {
      assignedItems,
      failed,
    };
  });
}

/**
 * Unassign an incoming shipment item from its customer
 */
export async function unassignIncomingShipmentItem(
  itemId: string,
  unassignedBy: string,
  reason?: string
): Promise<IncomingShipmentItem | null> {
  try {
    const [updatedItem] = await db
      .update(incomingShipmentItems)
      .set({
        assignedCustomerProfileId: null,
        assignedBy: null,
        assignedAt: null,
        assignmentStatus: 'unassigned' as ItemAssignmentStatus,
        notes: reason ? `Unassigned by ${unassignedBy}: ${reason}` : `Unassigned by ${unassignedBy}`,
        updatedAt: new Date(),
      })
      .where(eq(incomingShipmentItems.id, itemId))
      .returning();

    return updatedItem || null;
  } catch (error) {
    console.error('Error unassigning incoming shipment item:', error);
    throw error;
  }
}

/**
 * Bulk reassign items from one customer to another
 */
export async function reassignIncomingShipmentItems(
  itemIds: string[],
  fromCustomerProfileId: string,
  toCustomerProfileId: string,
  reassignedBy: string,
  reason?: string
): Promise<AssignIncomingShipmentItemsResult> {
  const assignedItems: AssignIncomingShipmentItemsResult['assignedItems'] = [];
  const failed: AssignIncomingShipmentItemsResult['failed'] = [];

  return await db.transaction(async (tx) => {
    for (const itemId of itemIds) {
      try {
        // Check if the item is currently assigned to the specified customer
        const [existingItem] = await tx
          .select()
          .from(incomingShipmentItems)
          .where(
            and(
              eq(incomingShipmentItems.id, itemId),
              eq(incomingShipmentItems.assignedCustomerProfileId, fromCustomerProfileId)
            )
          )
          .limit(1);

        if (!existingItem) {
          failed.push({
            itemId,
            error: 'Item not found or not assigned to the specified customer',
          });
          continue;
        }

        // Reassign to the new customer
        const assignedAt = new Date();
        const [updatedItem] = await tx
          .update(incomingShipmentItems)
          .set({
            assignedCustomerProfileId: toCustomerProfileId,
            assignedBy: reassignedBy,
            assignedAt,
            assignmentStatus: 'assigned' as ItemAssignmentStatus,
            notes: reason ? `Reassigned: ${reason}` : 'Reassigned to different customer',
            updatedAt: new Date(),
          })
          .where(eq(incomingShipmentItems.id, itemId))
          .returning();

        if (updatedItem) {
          assignedItems.push({
            id: updatedItem.id,
            trackingNumber: updatedItem.trackingNumber,
            assignedCustomerProfileId: updatedItem.assignedCustomerProfileId!,
            assignedAt: assignedAt.toISOString(),
            assignedBy: updatedItem.assignedBy!,
          });
        } else {
          failed.push({
            itemId,
            error: 'Failed to reassign item',
          });
        }
      } catch (error) {
        console.error(`Error reassigning item ${itemId}:`, error);
        failed.push({
          itemId,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    return {
      assignedItems,
      failed,
    };
  });
}