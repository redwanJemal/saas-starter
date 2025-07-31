// features/shipping/db/queries/zones/get-zone-countries.query.ts

import { db } from '@/lib/db';
import { zoneCountries } from '../../schema';
import { countries } from '@/features/settings/db/schema';
import { eq } from 'drizzle-orm';
import type { ZoneCountry } from '../../../types/shipping.types';

export async function getZoneCountries(zoneId: string): Promise<ZoneCountry[]> {
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
    .where(eq(zoneCountries.zoneId, zoneId));

  return zoneCountriesQuery.map(zc => ({
    id: zc.id,
    zoneId: zc.zoneId,
    countryCode: zc.countryCode,
    createdAt: zc.createdAt.toISOString(),
    country: zc.country ? {
      code: zc.country.code,
      name: zc.country.name,
      isActive: zc.country.isActive || false,
    } : undefined,
  }));
}