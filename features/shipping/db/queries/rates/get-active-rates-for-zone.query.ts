
// features/shipping/db/queries/rates/get-active-rates-for-zone.query.ts

import { db } from '@/lib/db';
import { shippingRates, zones } from '../../schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq, and, or, lte, gte, isNull } from 'drizzle-orm';
import type { ShippingRate } from '../../../types/shipping.types';

export async function getActiveRatesForZone(
  zoneId: string,
  warehouseId?: string
): Promise<ShippingRate[]> {
  // Build where conditions
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  let whereConditions = [
    eq(shippingRates.zoneId, zoneId),
    eq(shippingRates.isActive, true),
    lte(shippingRates.effectiveFrom, currentDateStr),
    or(
      isNull(shippingRates.effectiveUntil),
      gte(shippingRates.effectiveUntil, currentDateStr)
    )
  ];

  if (warehouseId) {
    whereConditions.push(eq(shippingRates.warehouseId, warehouseId));
  }

  const whereClause = and(...whereConditions);

  // Get active rates with related info
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
    .where(whereClause);

  // Transform to ShippingRate type
  return ratesQuery.map(rate => ({
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
    effectiveFrom: rate.effectiveFrom,
    effectiveUntil: rate.effectiveUntil || undefined,
    createdAt: rate.createdAt instanceof Date ? rate.createdAt.toISOString() : rate.createdAt,
    updatedAt: rate.updatedAt instanceof Date ? rate.updatedAt.toISOString() : rate.updatedAt,
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
}