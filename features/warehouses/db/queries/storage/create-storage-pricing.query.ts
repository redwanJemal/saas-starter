// features/warehouses/db/queries/storage/create-storage-pricing.query.ts
import { db } from '@/lib/db';
import { storagePricing, warehouses } from '@/features/warehouses/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateStoragePricingData, StoragePricing } from '@/features/warehouses/db/schema';

export async function createStoragePricing(
  tenantId: string,
  data: CreateStoragePricingData
): Promise<StoragePricing> {
  // Validate warehouse exists and belongs to tenant
  const warehouseExists = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(
      eq(warehouses.id, data.warehouseId!),
      eq(warehouses.tenantId, tenantId)
    ))
    .limit(1);

  if (warehouseExists.length === 0) {
    throw new Error('Warehouse not found');
  }

  // Create new storage pricing
  const newPricingData = {
    tenantId,
    warehouseId: data.warehouseId!,
    freeDays: data.freeDays,
    dailyRateAfterFree: data.dailyRateAfterFree,
    currency: data.currency || 'USD',
    effectiveFrom: data.effectiveFrom,
    effectiveUntil: data.effectiveUntil,
    isActive: true,
    notes: data.notes || null,
  };

  const [newPricing] = await db
    .insert(storagePricing)
    .values(newPricingData)
    .returning();

  return newPricing;
}