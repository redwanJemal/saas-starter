// features/warehouses/db/queries/storage/get-storage-pricing-by-id.query.ts
import { db } from '@/lib/db';
import { storagePricing, warehouses } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';

export async function getStoragePricingById(id: string) {
  const pricingResult = await db
    .select({
      id: storagePricing.id,
      tenantId: storagePricing.tenantId,
      warehouseId: storagePricing.warehouseId,
      freeDays: storagePricing.freeDays,
      dailyRateAfterFree: storagePricing.dailyRateAfterFree,
      currency: storagePricing.currency,
      effectiveFrom: storagePricing.effectiveFrom,
      effectiveUntil: storagePricing.effectiveUntil,
      isActive: storagePricing.isActive,
      notes: storagePricing.notes,
      createdAt: storagePricing.createdAt,
      updatedAt: storagePricing.updatedAt,
      // Warehouse info
      warehouseCode: warehouses.code,
      warehouseName: warehouses.name,
      warehouseCity: warehouses.city,
      warehouseCountryCode: warehouses.countryCode,
    })
    .from(storagePricing)
    .innerJoin(warehouses, eq(storagePricing.warehouseId, warehouses.id))
    .where(eq(storagePricing.id, id))
    .limit(1);

  if (pricingResult.length === 0) {
    return null;
  }

  return pricingResult[0];
}