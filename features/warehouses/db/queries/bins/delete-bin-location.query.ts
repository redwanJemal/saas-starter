// features/warehouses/db/queries/bins/delete-bin-location.query.ts
import { db } from '@/lib/db';
import { binLocations, packageBinAssignments } from '@/features/warehouses/db/schema';
import { eq, count, isNull, and } from 'drizzle-orm';

export async function deleteBinLocation(id: string): Promise<boolean> {
  // Check if bin exists
  const existingBin = await db
    .select()
    .from(binLocations)
    .where(eq(binLocations.id, id))
    .limit(1);

  if (existingBin.length === 0) {
    return false;
  }

  // Check if bin has active package assignments
  const [activeAssignments] = await db
    .select({ count: count() })
    .from(packageBinAssignments)
    .where(and(
      eq(packageBinAssignments.binId, id),
      isNull(packageBinAssignments.removedAt)
    ));

  if ((activeAssignments?.count || 0) > 0) {
    throw new Error('Cannot delete bin location with active package assignments');
  }

  // Delete bin location
  await db
    .delete(binLocations)
    .where(eq(binLocations.id, id));

  return true;
}
