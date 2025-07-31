// features/shipping/db/queries/zones/update-zone.query.ts

import { db } from '@/lib/db';
import { zones, zoneCountries } from '../../schema';
import { eq, and } from 'drizzle-orm';
import type { Zone, UpdateZoneData } from '../../../types/shipping.types';

export async function updateZone(
  id: string,
  tenantId: string,
  data: UpdateZoneData
): Promise<Zone | null> {
  const {
    name,
    description,
    isActive,
    countries
  } = data;

  // Check if zone exists and belongs to tenant
  const existingZone = await db
    .select()
    .from(zones)
    .where(
      and(
        eq(zones.id, id),
        eq(zones.tenantId, tenantId)
      )
    )
    .limit(1);

  if (existingZone.length === 0) {
    return null;
  }

  // Check if new name conflicts with existing zones (if name is being changed)
  if (name && name !== existingZone[0].name) {
    const nameConflict = await db
      .select()
      .from(zones)
      .where(
        and(
          eq(zones.tenantId, tenantId),
          eq(zones.name, name)
        )
      )
      .limit(1);

    if (nameConflict.length > 0) {
      throw new Error('Zone with this name already exists');
    }
  }

  // Update zone in transaction
  const result = await db.transaction(async (tx) => {
    // Update zone
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedZone] = await tx
      .update(zones)
      .set(updateData)
      .where(
        and(
          eq(zones.id, id),
          eq(zones.tenantId, tenantId)
        )
      )
      .returning();

    // Update countries if provided
    if (countries !== undefined) {
      // Remove existing countries
      await tx
        .delete(zoneCountries)
        .where(eq(zoneCountries.zoneId, id));

      // Add new countries
      if (countries.length > 0) {
        const validCountries = countries.filter(code => code && code.length === 2);
        
        if (validCountries.length > 0) {
          const countryInserts = validCountries.map((countryCode: string) => ({
            zoneId: id,
            countryCode: countryCode.toUpperCase(),
          }));

          await tx
            .insert(zoneCountries)
            .values(countryInserts);
        }
      }
    }

    return updatedZone;
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
    countryCount: countries?.length || 0,
  };

  return transformedZone;
}