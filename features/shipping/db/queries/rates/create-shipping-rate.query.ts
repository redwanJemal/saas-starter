// features/shipping/db/queries/rates/create-shipping-rate.query.ts

import { db } from '@/lib/db';
import { shippingRates, zones } from '../../schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq, and, or, gte, lte, SQL } from 'drizzle-orm';
import { createDateOverlapCondition } from '../../../utils/date-overlap';
import type { ShippingRate, CreateShippingRateData } from '../../../types/shipping.types';

export async function createShippingRate(
  tenantId: string,
  data: CreateShippingRateData
): Promise<ShippingRate> {
  const {
    warehouseId,
    zoneId,
    serviceType,
    baseRate,
    perKgRate,
    minCharge,
    maxWeightKg,
    currencyCode = 'USD',
    isActive = true,
    effectiveFrom,
    effectiveUntil
  } = data;

  // Validate warehouse exists and belongs to tenant
  const warehouse = await db
    .select()
    .from(warehouses)
    .where(
      and(
        eq(warehouses.id, warehouseId),
        eq(warehouses.tenantId, tenantId)
      )
    )
    .limit(1);

  if (warehouse.length === 0) {
    throw new Error('Warehouse not found');
  }

  // Validate zone exists and belongs to tenant
  const zone = await db
    .select()
    .from(zones)
    .where(
      and(
        eq(zones.id, zoneId),
        eq(zones.tenantId, tenantId)
      )
    )
    .limit(1);

  if (zone.length === 0) {
    throw new Error('Zone not found');
  }

  const effectiveFromDate = new Date(effectiveFrom);
  const effectiveUntilDate = effectiveUntil ? new Date(effectiveUntil) : null;

  // Validate date range
  if (effectiveUntilDate && effectiveUntilDate <= effectiveFromDate) {
    throw new Error('Effective until date must be after effective from date');
  }

  // Check for overlapping rates for the same warehouse, zone, and service type
  const overlapConditions: SQL<unknown>[] = [
    eq(shippingRates.tenantId, tenantId),
    eq(shippingRates.warehouseId, warehouseId),
    eq(shippingRates.zoneId, zoneId),
    eq(shippingRates.serviceType, serviceType),
    eq(shippingRates.isActive, true)
  ];

  // Format dates as strings for Drizzle ORM
  const effectiveFromStr = effectiveFromDate.toISOString().split('T')[0];
  const effectiveUntilStr = effectiveUntilDate ? effectiveUntilDate.toISOString().split('T')[0] : null;

  // Add date overlap condition using the utility function
  overlapConditions.push(
    createDateOverlapCondition(
      shippingRates.effectiveFrom as unknown as SQL<unknown>,
      shippingRates.effectiveUntil as unknown as SQL<unknown>,
      effectiveFromStr,
      effectiveUntilStr
    )
  );

  // Filter out any undefined conditions
  const validConditions = overlapConditions.filter(Boolean);
  
  const overlapping = await db
    .select()
    .from(shippingRates)
    .where(and(...validConditions))
    .limit(1);

  if (overlapping.length > 0) {
    throw new Error('A shipping rate already exists for this warehouse, zone, service type, and date range');
  }

  // Create shipping rate
  const [newRate] = await db
    .insert(shippingRates)
    .values({
      tenantId,
      warehouseId,
      zoneId,
      serviceType,
      baseRate,
      perKgRate,
      minCharge,
      maxWeightKg: maxWeightKg || null,
      currencyCode,
      isActive: isActive || false,
      effectiveFrom: effectiveFromDate.toISOString(),
      effectiveUntil: effectiveUntilDate?.toISOString(),
    })
    .returning();

  // Transform to ShippingRate type
  const transformedRate: ShippingRate = {
    id: newRate.id,
    tenantId: newRate.tenantId,
    warehouseId: newRate.warehouseId,
    zoneId: newRate.zoneId,
    serviceType: newRate.serviceType as any,
    baseRate: newRate.baseRate,
    perKgRate: newRate.perKgRate,
    minCharge: newRate.minCharge,
    maxWeightKg: newRate.maxWeightKg || undefined,
    currencyCode: newRate.currencyCode,
    isActive: newRate.isActive || false,
    effectiveFrom: newRate.effectiveFrom.toString().split('T')[0],
    effectiveUntil: newRate.effectiveUntil?.toString().split('T')[0] || undefined,
    createdAt: newRate.createdAt.toISOString(),
    updatedAt: newRate.updatedAt.toISOString(),
    warehouse: {
      id: warehouse[0].id,
      name: warehouse[0].name,
      code: warehouse[0].code,
      city: warehouse[0].city,
      countryCode: warehouse[0].countryCode,
    },
    zone: {
      id: zone[0].id,
      name: zone[0].name,
      description: zone[0].description || undefined,
    },
  };

  return transformedRate;
}