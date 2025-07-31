// features/shipping/db/queries/utils/transform-zone.query.ts

import type { Zone } from '../../../types/shipping.types';

/**
 * Transform database zone record to frontend format
 */
export function transformZone(zone: any): Zone {
  return {
    id: zone.id,
    tenantId: zone.tenantId,
    name: zone.name,
    description: zone.description || undefined,
    isActive: zone.isActive,
    createdAt: zone.createdAt?.toISOString() || '',
    updatedAt: zone.updatedAt?.toISOString() || '',
    countries: zone.countries || [],
    countryCount: zone.countryCount || 0,
  };
}
