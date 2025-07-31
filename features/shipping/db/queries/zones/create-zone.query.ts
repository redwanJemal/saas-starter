// features/shipping/db/queries/zones/create-zone.query.ts

import { db } from '@/lib/db';
import { zones, zoneCountries } from '../../schema';
import { eq, and } from 'drizzle-orm';
import type { Zone, CreateZoneData } from '../../../types/shipping.types';

export async function createZone(
  tenantId: string,
  data: CreateZoneData
): Promise<Zone> {
  const {
    name,
    description,
    isActive = true,
    countries = []
  } = data;

  // Check if zone name already exists for this tenant
  const existingZone = await db
    .select()
    .from(zones)
    .where(
      and(
        eq(zones.tenantId, tenantId),
        eq(zones.name, name)
      )
    )
    .limit(1);

  if (existingZone.length > 0) {
    throw new Error('Zone with this name already exists');
  }

  // Create zone in transaction
  const result = await db.transaction(async (tx) => {
    // Create the zone
    const [newZone] = await tx
      .insert(zones)
      .values({
        tenantId,
        name,
        description,
        isActive,
      })
      .returning();

    // Add countries if provided
    if (countries.length > 0) {
      const validCountries = countries.filter(code => code && code.length === 2);
      
      if (validCountries.length > 0) {
        const countryInserts = validCountries.map((countryCode: string) => ({
          zoneId: newZone.id,
          countryCode: countryCode.toUpperCase(),
        }));

        await tx
          .insert(zoneCountries)
          .values(countryInserts);
      }
    }

    return newZone;
  });

  // Transform to Zone type
  const transformedZone: Zone = {
    id: result.id,
    tenantId: result.tenantId,
    name: result.name,
    description: result.description || undefined,
    isActive: result.isActive || false,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
    countryCount: countries.length,
  };

  return transformedZone;
}