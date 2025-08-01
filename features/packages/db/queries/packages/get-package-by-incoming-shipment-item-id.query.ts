// features/packages/db/queries/packages/get-package-by-incoming-shipment-item-id.query.ts

import { db } from '@/lib/db';
import { 
  packages, 
  type Package
} from '@/features/packages/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get a package by its associated incoming shipment item ID
 * Used to check if a package already exists for an incoming shipment item
 */
export async function getPackageByIncomingShipmentItemId(
  incomingShipmentItemId: string
): Promise<Package | null> {
  const [result] = await db
    .select()
    .from(packages)
    .where(eq(packages.incomingShipmentItemId, incomingShipmentItemId))
    .limit(1);

  return result || null;
}
