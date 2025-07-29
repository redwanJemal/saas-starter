// features/warehouse/db/queries/warehouses/get-warehouse-by-id.query.ts
import { db } from '@/lib/db';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import type { Warehouse } from '@/features/warehouses/db/schema';

export async function getWarehouseById(id: string): Promise<Warehouse | null> {
  const warehouseResult = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.id, id))
    .limit(1);

  if (warehouseResult.length === 0) {
    return null;
  }

  return warehouseResult[0];
}