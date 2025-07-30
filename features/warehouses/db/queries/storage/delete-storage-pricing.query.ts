// features/warehouses/db/queries/storage/delete-storage-pricing.query.ts
import { db } from '@/lib/db';
import { storagePricing } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';

export async function deleteStoragePricing(id: string): Promise<boolean> {
  // Check if pricing exists
  const existingPricing = await db
    .select()
    .from(storagePricing)
    .where(eq(storagePricing.id, id))
    .limit(1);

  if (existingPricing.length === 0) {
    return false;
  }

  // Note: In a real application, you might want to check for:
  // - Active storage charges using this pricing
  // - Instead of deleting, you might want to deactivate
  // For now, we'll allow deletion

  // Delete pricing
  await db
    .delete(storagePricing)
    .where(eq(storagePricing.id, id));

  return true;
}