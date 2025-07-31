
// features/shipping/db/queries/rates/update-shipping-rate.query.ts

import { db } from '@/lib/db';
import { shippingRates, zones } from '../../schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq, and, or, gte, lte, ne, SQL, sql } from 'drizzle-orm';
import { createDateOverlapCondition } from '../../../utils/date-overlap';
import type { ShippingRate, UpdateShippingRateData } from '../../../types/shipping.types';
import { getShippingRateById } from './get-shipping-rate-by-id.query';

export async function updateShippingRate(
  id: string,
  tenantId: string,
  data: UpdateShippingRateData
): Promise<ShippingRate | null> {
  // Check if rate exists and belongs to tenant
  const existingRate = await db
    .select()
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.id, id),
        eq(shippingRates.tenantId, tenantId)
      )
    )
    .limit(1);

  if (existingRate.length === 0) {
    return null;
  }

  const currentRate = existingRate[0];

  // Validate warehouse if being updated
  if (data.warehouseId && data.warehouseId !== currentRate.warehouseId) {
    const warehouse = await db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.id, data.warehouseId),
          eq(warehouses.tenantId, tenantId)
        )
      )
      .limit(1);

    if (warehouse.length === 0) {
      throw new Error('Warehouse not found');
    }
  }

  // Validate zone if being updated
  if (data.zoneId && data.zoneId !== currentRate.zoneId) {
    const zone = await db
      .select()
      .from(zones)
      .where(
        and(
          eq(zones.id, data.zoneId),
          eq(zones.tenantId, tenantId)
        )
      )
      .limit(1);

    if (zone.length === 0) {
      throw new Error('Zone not found');
    }
  }

  // Validate date range if being updated
  const effectiveFromDate = data.effectiveFrom ? new Date(data.effectiveFrom) : currentRate.effectiveFrom;
  const effectiveUntilDate = data.effectiveUntil ? new Date(data.effectiveUntil) : currentRate.effectiveUntil;

  if (effectiveUntilDate && effectiveUntilDate <= effectiveFromDate) {
    throw new Error('Effective until date must be after effective from date');
  }

  // Check for overlapping rates if critical fields are being updated
  const criticalFieldsUpdated = data.warehouseId || data.zoneId || data.serviceType || data.effectiveFrom || data.effectiveUntil;
  
  if (criticalFieldsUpdated) {
    const warehouseId = data.warehouseId || currentRate.warehouseId;
    const zoneId = data.zoneId || currentRate.zoneId;
    const serviceType = data.serviceType || currentRate.serviceType;

    // Build conditions to check for overlaps
    const overlapConditions: SQL<unknown>[] = [
      eq(shippingRates.tenantId, tenantId),
      eq(shippingRates.warehouseId, warehouseId),
      eq(shippingRates.zoneId, zoneId),
      eq(shippingRates.serviceType, serviceType),
      eq(shippingRates.isActive, true),
      ne(shippingRates.id, id) // Exclude current rate
    ];

    // Format dates as strings for Drizzle ORM
    const effectiveFromStr = effectiveFromDate.toString().split('T')[0];
    const effectiveUntilStr = effectiveUntilDate ? effectiveUntilDate.toString().split('T')[0] : null;

    // Add date overlap condition using the utility function
    overlapConditions.push(
      createDateOverlapCondition(
        sql`${shippingRates.effectiveFrom}`,
        sql`${shippingRates.effectiveUntil}`,
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
      .limit(2); // Get up to 2 to check if any besides current

    // Filter out current rate from results
    const conflictingRates = overlapping.filter(rate => rate.id !== id);
    
    if (conflictingRates.length > 0) {
      throw new Error('A shipping rate already exists for this warehouse, zone, service type, and date range');
    }
  }

  // Update shipping rate
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.warehouseId !== undefined) updateData.warehouseId = data.warehouseId;
  if (data.zoneId !== undefined) updateData.zoneId = data.zoneId;
  if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
  if (data.baseRate !== undefined) updateData.baseRate = data.baseRate;
  if (data.perKgRate !== undefined) updateData.perKgRate = data.perKgRate;
  if (data.minCharge !== undefined) updateData.minCharge = data.minCharge;
  if (data.maxWeightKg !== undefined) updateData.maxWeightKg = data.maxWeightKg;
  if (data.currencyCode !== undefined) updateData.currencyCode = data.currencyCode;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.effectiveFrom !== undefined) updateData.effectiveFrom = effectiveFromDate;
  if (data.effectiveUntil !== undefined) updateData.effectiveUntil = effectiveUntilDate;

  const [updatedRate] = await db
    .update(shippingRates)
    .set(updateData)
    .where(
      and(
        eq(shippingRates.id, id),
        eq(shippingRates.tenantId, tenantId)
      )
    )
    .returning();

  // Get updated rate with relations
  return getShippingRateById(updatedRate.id, tenantId);
}
