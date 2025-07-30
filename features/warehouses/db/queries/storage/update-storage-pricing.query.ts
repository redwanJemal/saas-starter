// features/warehouses/db/queries/storage/update-storage-pricing.query.ts
import { db } from '@/lib/db';
import { storagePricing } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateStoragePricingData, StoragePricing } from '@/features/warehouses/db/schema';

export async function updateStoragePricing(
  id: string,
  data: UpdateStoragePricingData
): Promise<StoragePricing | null> {
  // Check if pricing exists
  const existingPricing = await db
    .select()
    .from(storagePricing)
    .where(eq(storagePricing.id, id))
    .limit(1);

  if (existingPricing.length === 0) {
    return null;
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  // Only update fields that are provided
  if (data.freeDays !== undefined) updateData.freeDays = data.freeDays;
  if (data.dailyRateAfterFree !== undefined) updateData.dailyRateAfterFree = data.dailyRateAfterFree;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.effectiveFrom !== undefined) updateData.effectiveFrom = new Date(data.effectiveFrom);
  if (data.effectiveUntil !== undefined) updateData.effectiveUntil = data.effectiveUntil ? new Date(data.effectiveUntil) : null;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Update pricing
  const [updatedPricing] = await db
    .update(storagePricing)
    .set(updateData)
    .where(eq(storagePricing.id, id))
    .returning();

  return updatedPricing;
}