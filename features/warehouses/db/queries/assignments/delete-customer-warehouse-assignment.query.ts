// features/warehouses/db/queries/assignments/delete-customer-warehouse-assignment.query.ts
import { db } from '@/lib/db';
import { customerWarehouseAssignments } from '@/features/warehouses/db/schema';
import { eq, count } from 'drizzle-orm';

export async function deleteCustomerWarehouseAssignment(id: string): Promise<boolean> {
  // Check if assignment exists
  const existingAssignment = await db
    .select()
    .from(customerWarehouseAssignments)
    .where(eq(customerWarehouseAssignments.id, id))
    .limit(1);

  if (existingAssignment.length === 0) {
    return false;
  }

  // Note: In a real application, you might want to check for:
  // - Active packages assigned to this customer in this warehouse
  // - Active storage charges
  // For now, we'll allow deletion but you should add these checks

  // Delete assignment
  await db
    .delete(customerWarehouseAssignments)
    .where(eq(customerWarehouseAssignments.id, id));

  return true;
}