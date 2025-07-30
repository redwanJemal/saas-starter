// features/warehouses/db/queries/bins/remove-package-bin-assignment.query.ts
import { db } from '@/lib/db';
import { packageBinAssignments } from '@/features/warehouses/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

interface RemovePackageBinAssignmentData {
  packageId?: string;
  binAssignmentId?: string;
  removalReason?: string;
  notes?: string;
}

export async function removePackageBinAssignment(
  data: RemovePackageBinAssignmentData,
  removedBy: string
): Promise<boolean> {
  let whereCondition;
  
  if (data.binAssignmentId) {
    whereCondition = and(
      eq(packageBinAssignments.id, data.binAssignmentId),
      isNull(packageBinAssignments.removedAt)
    );
  } else if (data.packageId) {
    whereCondition = and(
      eq(packageBinAssignments.packageId, data.packageId),
      isNull(packageBinAssignments.removedAt)
    );
  } else {
    throw new Error('Either binAssignmentId or packageId must be provided');
  }

  // Check if assignment exists and is active
  const existingAssignment = await db
    .select({ id: packageBinAssignments.id })
    .from(packageBinAssignments)
    .where(whereCondition)
    .limit(1);

  if (existingAssignment.length === 0) {
    return false;
  }

  // Update assignment to mark as removed
  await db
    .update(packageBinAssignments)
    .set({
      removedAt: new Date(),
      removalReason: data.removalReason || 'Manual removal',
      notes: data.notes ? `${data.notes} (Removed)` : 'Removed',
      removedBy,
    })
    .where(whereCondition);

  return true;
}