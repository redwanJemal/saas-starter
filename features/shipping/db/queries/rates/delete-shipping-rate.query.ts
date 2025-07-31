
// features/shipping/db/queries/rates/delete-shipping-rate.query.ts

import { db } from '@/lib/db';
import { shippingRates, shipments } from '../../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteShippingRate(
  id: string,
  tenantId: string
): Promise<boolean> {
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
    return false;
  }

  // Check if rate is being used by any shipments
  const usedInShipments = await db
    .select()
    .from(shipments)
    .where(eq(shipments.zoneId, existingRate[0].zoneId))
    .limit(1);

  if (usedInShipments.length > 0) {
    throw new Error('Shipping rate cannot be deleted because it is being used by existing shipments');
  }

  // Delete shipping rate
  await db
    .delete(shippingRates)
    .where(
      and(
        eq(shippingRates.id, id),
        eq(shippingRates.tenantId, tenantId)
      )
    );

  return true;
}
