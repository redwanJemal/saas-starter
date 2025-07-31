// features/packages/db/queries/package-status/update-package-status.query.ts

import { db } from '@/lib/db';
import { packages, packageStatusHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PackageStatus, Package } from '@/features/packages/types/package.types';

export async function updatePackageStatus(
  packageId: string,
  newStatus: PackageStatus,
  reason?: string,
  notes?: string,
  changedBy?: string
): Promise<Package | null> {
  return await db.transaction(async (tx) => {
    // First, get the current package to track the status change
    const [currentPackage] = await tx
      .select()
      .from(packages)
      .where(eq(packages.id, packageId))
      .limit(1);

    if (!currentPackage) {
      return null;
    }

    // Update the package status
    const [updatedPackage] = await tx
      .update(packages)
      .set({
        status: newStatus,
        updatedAt: new Date(),
        // Update specific timestamp fields based on status
        ...(newStatus === 'received' && { receivedAt: new Date() }),
        ...(newStatus === 'ready_to_ship' && { readyToShipAt: new Date() }),
        ...(newStatus === 'shipped' && !currentPackage.readyToShipAt && { readyToShipAt: new Date() }),
      })
      .where(eq(packages.id, packageId))
      .returning();

    // Create status history record
    await tx
      .insert(packageStatusHistory)
      .values({
        packageId: packageId,
        fromStatus: currentPackage.status as PackageStatus,
        toStatus: newStatus,
        changeReason: reason || 'status_update',
        notes: notes,
        changedBy: changedBy || null,
        createdAt: new Date(),
      });

    return updatedPackage;
  });
}