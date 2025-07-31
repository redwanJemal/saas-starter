// features/shipping/db/queries/rates/get-shipping-rate-by-id.query.ts

import { db } from '@/lib/db';
import { shippingRates, zones } from '../../schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ShippingRate } from '../../../types/shipping.types';

export async function getShippingRateById(
  id: string,
  tenantId?: string
): Promise<ShippingRate | null> {
  // Build where conditions
  let whereConditions = [eq(shippingRates.id, id)];
  if (tenantId) {
    whereConditions.push(eq(shippingRates.tenantId, tenantId));
  }

  const whereClause = whereConditions.length > 1 
    ? and(...whereConditions) 
    : whereConditions[0];

  // Get shipping rate with related info
  const rateQuery = await db
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
    .limit(1);

  if (rateQuery.length === 0) {
    return null;
  }

  const rate = rateQuery[0];

  // Transform to ShippingRate type
  const transformedRate: ShippingRate = {
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
    effectiveFrom: rate.effectiveFrom.toString().split('T')[0],
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
  };

  return transformedRate;
}
