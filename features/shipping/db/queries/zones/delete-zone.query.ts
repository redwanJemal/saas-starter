// features/shipping/db/queries/zones/delete-zone.query.ts

import { db } from '@/lib/db';
import { zones, zoneCountries, shippingRates } from '../../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteZone(
  id: string,
  tenantId: string
): Promise<boolean> {
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
    return false;
  }

  // Check if zone has active shipping rates
  const activeRates = await db
    .select()
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.zoneId, id),
        eq(shippingRates.isActive, true)
      )
    )
    .limit(1);

  if (activeRates.length > 0) {
    throw new Error('Zone cannot be deleted because it has active shipping rates');
  }

  // Delete zone in transaction (cascade will handle zone countries)
  await db.transaction(async (tx) => {
    // First delete zone countries
    await tx
      .delete(zoneCountries)
      .where(eq(zoneCountries.zoneId, id));

    // Then delete the zone
    await tx
      .delete(zones)
      .where(
        and(
          eq(zones.id, id),
          eq(zones.tenantId, tenantId)
        )
      );
  });

  return true;
}