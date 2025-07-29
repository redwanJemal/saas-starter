// features/warehouse/db/queries/warehouses/delete-warehouse.query.ts
import { db } from '@/lib/db';
import { warehouses, customerWarehouseAssignments } from '@/features/warehouses/db/schema';
import { eq, count } from 'drizzle-orm';

export async function deleteWarehouse(id: string): Promise<boolean> {
  // Check if warehouse exists
  const existingWarehouse = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.id, id))
    .limit(1);

  if (existingWarehouse.length === 0) {
    return false;
  }

  // Check if warehouse has active customer assignments
  const assignmentCount = await db
    .select({ count: count() })
    .from(customerWarehouseAssignments)
    .where(eq(customerWarehouseAssignments.warehouseId, id));

  if (assignmentCount[0].count > 0) {
    throw new Error('Cannot delete warehouse with active customer assignments');
  }

  // Note: In a real application, you might also want to check for:
  // - Active packages in this warehouse
  // - Active storage charges
  // - Bin locations with packages
  // For now, we'll rely on database cascade deletes

  // Delete warehouse
  await db.delete(warehouses).where(eq(warehouses.id, id));

  return true;
}