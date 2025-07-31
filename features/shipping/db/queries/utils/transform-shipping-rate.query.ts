
// features/shipping/db/queries/utils/transform-shipping-rate.query.ts

import type { ShippingRate } from '../../../types/shipping.types';

/**
 * Transform database shipping rate record to frontend format
 */
export function transformShippingRate(rate: any): ShippingRate {
  return {
    id: rate.id,
    tenantId: rate.tenantId,
    warehouseId: rate.warehouseId,
    zoneId: rate.zoneId,
    serviceType: rate.serviceType,
    baseRate: rate.baseRate,
    perKgRate: rate.perKgRate,
    minCharge: rate.minCharge,
    maxWeightKg: rate.maxWeightKg || undefined,
    currencyCode: rate.currencyCode,
    isActive: rate.isActive,
    effectiveFrom: rate.effectiveFrom?.toISOString?.()?.split('T')[0] || rate.effectiveFrom,
    effectiveUntil: rate.effectiveUntil?.toISOString?.()?.split('T')[0] || rate.effectiveUntil || undefined,
    createdAt: rate.createdAt?.toISOString() || '',
    updatedAt: rate.updatedAt?.toISOString() || '',
    warehouse: rate.warehouse,
    zone: rate.zone,
  };
}
