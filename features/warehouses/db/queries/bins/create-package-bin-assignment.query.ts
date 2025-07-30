// features/warehouses/db/queries/bins/create-package-bin-assignment.query.ts
import { db } from '@/lib/db';
import { packageBinAssignments, binLocations } from '@/features/warehouses/db/schema';
import { eq, and, isNull, count } from 'drizzle-orm';
import type { CreatePackageBinAssignmentData, PackageBinAssignment } from '@/features/warehouses/db/schema';
import { packages } from '@/lib/db/schema';

export async function createPackageBinAssignment(
  data: CreatePackageBinAssignmentData,
  assignedBy: string
): Promise<PackageBinAssignment> {
  // Validate package exists
  const packageExists = await db
    .select({ id: packages.id, status: packages.status })
    .from(packages)
    .where(eq(packages.id, data.packageId))
    .limit(1);

  if (packageExists.length === 0) {
    throw new Error('Package not found');
  }

  // Validate bin exists and is available
  const binExists = await db
    .select({ 
      id: binLocations.id, 
      maxCapacity: binLocations.maxCapacity,
      isActive: binLocations.isActive,
      isAvailable: binLocations.isAvailable 
    })
    .from(binLocations)
    .where(eq(binLocations.id, data.binId))
    .limit(1);

  if (binExists.length === 0) {
    throw new Error('Bin location not found');
  }

  const bin = binExists[0];
  if (!bin.isActive || !bin.isAvailable) {
    throw new Error('Bin location is not available');
  }

  // Check if package already has an active bin assignment
  const existingAssignment = await db
    .select({ id: packageBinAssignments.id })
    .from(packageBinAssignments)
    .where(and(
      eq(packageBinAssignments.packageId, data.packageId),
      isNull(packageBinAssignments.removedAt)
    ))
    .limit(1);

  if (existingAssignment.length > 0) {
    throw new Error('Package already has an active bin assignment');
  }

  // Check bin capacity if it has a limit
  if (bin.maxCapacity) {
    const [currentCount] = await db
      .select({ count: count() })
      .from(packageBinAssignments)
      .where(and(
        eq(packageBinAssignments.binId, data.binId),
        isNull(packageBinAssignments.removedAt)
      ));

    if ((currentCount?.count || 0) >= bin.maxCapacity) {
      throw new Error('Bin location is at maximum capacity');
    }
  }

  // Create new assignment
  const newAssignmentData = {
    packageId: data.packageId,
    binId: data.binId,
    assignedAt: new Date(),
    assignmentReason: data.assignmentReason || 'Manual assignment',
    notes: data.notes || null,
    assignedBy,
  };

  const [newAssignment] = await db
    .insert(packageBinAssignments)
    .values(newAssignmentData)
    .returning();

  return newAssignment;
}