// features/warehouses/db/queries/assignments/update-customer-warehouse-assignment.query.ts
import { db } from '@/lib/db';
import { customerWarehouseAssignments } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateCustomerWarehouseAssignmentData, CustomerWarehouseAssignment } from '@/features/warehouses/db/schema';

export async function updateCustomerWarehouseAssignment(
  id: string,
  data: UpdateCustomerWarehouseAssignmentData
): Promise<CustomerWarehouseAssignment | null> {
  // Check if assignment exists
  const existingAssignment = await db
    .select()
    .from(customerWarehouseAssignments)
    .where(eq(customerWarehouseAssignments.id, id))
    .limit(1);

  if (existingAssignment.length === 0) {
    return null;
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  // Only update fields that are provided
  if (data.status !== undefined) updateData.status = data.status;
  if (data.assignedAt !== undefined) updateData.assignedAt = new Date(data.assignedAt);
  if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Update assignment
  const [updatedAssignment] = await db
    .update(customerWarehouseAssignments)
    .set(updateData)
    .where(eq(customerWarehouseAssignments.id, id))
    .returning();

  return updatedAssignment;
}