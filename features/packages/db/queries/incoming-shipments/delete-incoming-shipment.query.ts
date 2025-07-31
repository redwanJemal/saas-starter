// features/packages/db/queries/incoming-shipments/delete-incoming-shipment.query.ts

import { db } from '@/lib/db';
import { incomingShipments, incomingShipmentItems, packages } from '@/features/packages/db/schema';
import { eq, count } from 'drizzle-orm';

export async function deleteIncomingShipment(id: string): Promise<boolean> {
  return await db.transaction(async (tx) => {
    try {
      // First, check if any items have been converted to packages
      const [itemsWithPackages] = await tx
        .select({ count: count() })
        .from(incomingShipmentItems)
        .innerJoin(packages, eq(incomingShipmentItems.id, packages.incomingShipmentItemId))
        .where(eq(incomingShipmentItems.incomingShipmentId, id));

      // If there are packages associated with items, we should not delete the shipment
      // Instead, we could set a status or handle this according to business rules
      if (itemsWithPackages.count > 0) {
        throw new Error('Cannot delete incoming shipment - some items have been converted to packages');
      }

      // Delete all incoming shipment items first
      await tx
        .delete(incomingShipmentItems)
        .where(eq(incomingShipmentItems.incomingShipmentId, id));

      // Finally, delete the incoming shipment
      const result = await tx
        .delete(incomingShipments)
        .where(eq(incomingShipments.id, id));

      return true;
    } catch (error) {
      console.error('Error deleting incoming shipment:', error);
      throw error;
    }
  });
}