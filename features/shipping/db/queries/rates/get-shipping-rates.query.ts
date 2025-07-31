// features/shipping/db/queries/rates/get-shipping-rates.query.ts

import { db } from '@/lib/db';
import { shippingRates, zones } from '../../schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq, and, desc, sql, count, or, ilike, gte, lte, SQL } from 'drizzle-orm';
import { createDateOverlapCondition } from '../../../utils/date-overlap';
import type { ShippingRate, ShippingRateFilters } from '../../../types/shipping.types';
import { PaginatedResponse } from '@/shared/types/api.types';

function createCondition(dateStr: string): SQL<unknown> {
    return and(
      lte(shippingRates.effectiveFrom, dateStr),
      or(
        eq(shippingRates.effectiveUntil as unknown as SQL<unknown>, null as unknown as SQL<unknown>),
        gte(shippingRates.effectiveUntil as unknown as SQL<unknown>, dateStr)
      )
    ) as SQL<unknown>;
}
export async function getShippingRates(
  tenantId: string,
  filters: ShippingRateFilters = {}
): Promise<PaginatedResponse<ShippingRate>> {
  const {
    warehouseId,
    zoneId,
    serviceType,
    isActive,
    effectiveDate,
    page = 1,
    limit = 10
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions: SQL<unknown>[] = [eq(shippingRates.tenantId, tenantId)];

  if (warehouseId) {
    whereConditions.push(eq(shippingRates.warehouseId, warehouseId));
  }

  if (zoneId) {
    whereConditions.push(eq(shippingRates.zoneId, zoneId));
  }

  if (serviceType) {
    whereConditions.push(eq(shippingRates.serviceType, serviceType));
  }

  if (typeof isActive === 'boolean') {
    whereConditions.push(eq(shippingRates.isActive, isActive));
  }

  if (effectiveDate) {
    const date = new Date(effectiveDate);
    const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Use the date overlap utility to check if the rate is effective on the given date
    // A rate is effective on a date if it starts before or on that date AND
    // either has no end date or ends after or on that date
    whereConditions.push(createCondition(dateStr));
  }

  // Handle where conditions
  let whereClause: SQL<unknown> | undefined;
  
  if (whereConditions.length > 1) {
    whereClause = and(...whereConditions);
  } else if (whereConditions.length === 1) {
    whereClause = whereConditions[0];
  }

  // Get shipping rates with related info
  const ratesQuery = await db
    .select({
      id: shippingRates.id,
      tenantId: shippingRates.tenantId,
      warehouseId: shippingRates.warehouseId,
      zoneId: shippingRates.zoneId,
      serviceType: shippingRates.serviceType,
      baseRate: shippingRates.baseRate,
      perKgRate: shippingRates.perKgRate,
      minCharge: shippingRates.minCharge,
      maxWeightKg: shippingRates.maxWeightKg,
      currencyCode: shippingRates.currencyCode,
      isActive: shippingRates.isActive,
      effectiveFrom: shippingRates.effectiveFrom,
      effectiveUntil: shippingRates.effectiveUntil,
      createdAt: shippingRates.createdAt,
      updatedAt: shippingRates.updatedAt,
      // Warehouse info
      warehouseName: warehouses.name,
      warehouseCode: warehouses.code,
      warehouseCity: warehouses.city,
      warehouseCountryCode: warehouses.countryCode,
      // Zone info
      zoneName: zones.name,
      zoneDescription: zones.description,
    })
    .from(shippingRates)
    .leftJoin(warehouses, eq(shippingRates.warehouseId, warehouses.id))
    .leftJoin(zones, eq(shippingRates.zoneId, zones.id))
    .where(whereClause)
    .orderBy(desc(shippingRates.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const totalCountQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(shippingRates)
    .where(whereClause);

  const totalItems = totalCountQuery[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Transform to ShippingRate type
  const transformedRates: ShippingRate[] = ratesQuery.map(rate => ({
    id: rate.id,
    tenantId: rate.tenantId,
    warehouseId: rate.warehouseId,
    zoneId: rate.zoneId,
    serviceType: rate.serviceType as any,
    baseRate: rate.baseRate,
    perKgRate: rate.perKgRate,
    minCharge: rate.minCharge,
    maxWeightKg: rate.maxWeightKg || undefined,
    currencyCode: rate.currencyCode,
    isActive: rate.isActive || false,
    effectiveFrom: rate.effectiveFrom.toString().split('T')[0], // Date only
    effectiveUntil: rate.effectiveUntil?.toString().split('T')[0] || undefined,
    createdAt: rate.createdAt.toString(),
    updatedAt: rate.updatedAt.toString(),
    warehouse: rate.warehouseName ? {
      id: rate.warehouseId,
      name: rate.warehouseName,
      code: rate.warehouseCode || '',
      city: rate.warehouseCity || '',
      countryCode: rate.warehouseCountryCode || '',
    } : undefined,
    zone: rate.zoneName ? {
      id: rate.zoneId,
      name: rate.zoneName,
      description: rate.zoneDescription || undefined,
    } : undefined,
  }));

  return {
    data: transformedRates,
    pagination: {
      page,
      limit,
      total: totalItems,
      pages: totalPages,
    },
  };
}