// features/warehouses/db/queries/storage/mark-storage-charges-invoiced.query.ts
import { db } from '@/lib/db';
import { storageCharges } from '@/features/warehouses/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function markStorageChargesInvoiced(
  chargeIds: string[],
  invoiceId: string
): Promise<boolean> {
  if (chargeIds.length === 0) {
    return false;
  }

  // Update storage charges to mark as invoiced
  await db
    .update(storageCharges)
    .set({
      isInvoiced: true,
      invoiceId,
    })
    .where(inArray(storageCharges.id, chargeIds));

  return true;
}