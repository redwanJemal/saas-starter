// features/warehouses/db/queries/storage/get-active-storage-pricing.query.ts
import { db } from '@/lib/db';
import { storagePricing } from '@/features/warehouses/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';

export async function getActiveStoragePricing(warehouseId: string, effectiveDate?: string) {
  const queryDate = effectiveDate || new Date().toISOString().split('T')[0];
  
  const pricingResult = await db
    .select()
    .from(storagePricing)
    .where(
      and(
        eq(storagePricing.warehouseId, warehouseId),
        eq(storagePricing.isActive, true),
        lte(storagePricing.effectiveFrom, queryDate),
        sql`(${storagePricing.effectiveUntil} IS NULL OR ${storagePricing.effectiveUntil} >= ${queryDate})`
      )
    )
    .orderBy(storagePricing.effectiveFrom)
    .limit(1);

  if (pricingResult.length === 0) {
    return null;
  }

  return pricingResult[0];
}