// features/warehouses/db/queries/storage/get-storage-pricing.query.ts
import { db } from '@/lib/db';
import { storagePricing, warehouses } from '@/features/warehouses/db/schema';
import { eq, and, desc, sql, lte, gte, isNull } from 'drizzle-orm';
import type { StoragePricingFilters } from '@/features/warehouses/db/schema';

export async function getStoragePricing(filters: StoragePricingFilters = {}) {
  const { page = 1, limit = 10, warehouseId, isActive, effectiveDate } = filters;

  // Build where conditions
  const conditions = [];
  
  if (warehouseId) {
    conditions.push(eq(storagePricing.warehouseId, warehouseId));
  }
  
  if (isActive !== undefined) {
    conditions.push(eq(storagePricing.isActive, isActive));
  }
  
  if (effectiveDate) {
    conditions.push(
      and(
        lte(storagePricing.effectiveFrom, effectiveDate),
        sql`(${storagePricing.effectiveUntil} IS NULL OR ${storagePricing.effectiveUntil} >= ${effectiveDate})`
      )
    );
  }

  // Create base query
  const baseQuery = db
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
    .innerJoin(warehouses, eq(storagePricing.warehouseId, warehouses.id));

  // Apply conditions
  const finalQuery = conditions.length > 0 
    ? baseQuery.where(and(...conditions)) 
    : baseQuery;

  // Execute query with ordering
  const allPricing = await finalQuery.orderBy(desc(storagePricing.effectiveFrom));

  // Calculate pagination
  const total = allPricing.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPricing = allPricing.slice(startIndex, endIndex);

  return {
    data: paginatedPricing,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}