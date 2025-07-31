// features/shipping/db/queries/zones/get-zone-by-id.query.ts

import { db } from '@/lib/db';
import { zones, zoneCountries } from '../../schema';
import { countries } from '@/features/settings/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Zone } from '../../../types/shipping.types';

export async function getZoneById(
  id: string,
  tenantId?: string
): Promise<Zone | null> {
  // Build where conditions
  let whereConditions = [eq(zones.id, id)];
  if (tenantId) {
    whereConditions.push(eq(zones.tenantId, tenantId));
  }

  const whereClause = whereConditions.length > 1 
    ? and(...whereConditions) 
    : whereConditions[0];

  // Get zone with countries
  const zoneQuery = await db
    .select({
      id: zones.id,
      tenantId: zones.tenantId,
      name: zones.name,
      description: zones.description,
      isActive: zones.isActive,
      createdAt: zones.createdAt,
      updatedAt: zones.updatedAt,
    })
    .from(zones)
    .where(whereClause)
    .limit(1);

  if (zoneQuery.length === 0) {
    return null;
  }

  const zone = zoneQuery[0];

  // Get countries for this zone
  const zoneCountriesQuery = await db
    .select({
      id: zoneCountries.id,
      zoneId: zoneCountries.zoneId,
      countryCode: zoneCountries.countryCode,
      createdAt: zoneCountries.createdAt,
      country: {
        code: countries.code,
        name: countries.name,
        isActive: countries.isActive,
      },
    })
    .from(zoneCountries)
    .leftJoin(countries, eq(zoneCountries.countryCode, countries.code))
    .where(eq(zoneCountries.zoneId, zone.id));

  // Transform to Zone type
  const transformedZone: Zone = {
    id: zone.id,
    tenantId: zone.tenantId,
    name: zone.name,
    description: zone.description || undefined,
    isActive: zone.isActive || false,
    createdAt: zone.createdAt.toISOString(),
    updatedAt: zone.updatedAt.toISOString(),
    countries: zoneCountriesQuery.map(zc => ({
      id: zc.id,
      zoneId: zc.zoneId,
      countryCode: zc.countryCode,
      createdAt: zc.createdAt.toISOString(),
      country: zc.country ? {
        code: zc.country.code,
        name: zc.country.name,
        isActive: zc.country.isActive || false,
      } : undefined,
    })),
    countryCount: zoneCountriesQuery.length,
  };

  return transformedZone;
}