// features/packages/db/queries/packages/bulk-update-packages.query.ts

import { db } from '@/lib/db';
import { packages, packageStatusHistory } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { BulkPackageAction, PackageStatus } from '@/features/packages/types/package.types';

export async function bulkUpdatePackages(
  action: BulkPackageAction,
  updatedBy?: string
): Promise<{ updated: number; failed: string[] }> {
  const { packageIds, action: actionType, data } = action;
  const failed: string[] = [];
  let updated = 0;

  return await db.transaction(async (tx) => {
    try {
      switch (actionType) {
        case 'update_status':
          if (!data?.status) {
            throw new Error('Status is required for update_status action');
          }

          // Get current packages to track status changes
          const currentPackages = await tx
            .select({ id: packages.id, status: packages.status })
            .from(packages)
            .where(inArray(packages.id, packageIds));

          // Update packages
          const updateResult = await tx
            .update(packages)
            .set({
              status: data.status as PackageStatus,
              updatedAt: new Date(),
            })
            .where(inArray(packages.id, packageIds))
            .returning({ id: packages.id });

          updated = updateResult.length;

          // Create status history records for successful updates
          if (updatedBy) {
            const statusHistoryRecords = currentPackages.map(pkg => ({
              packageId: pkg.id,
              fromStatus: pkg.status as PackageStatus,
              toStatus: data.status as PackageStatus,
              changeReason: data.reason || 'bulk_update',
              changedBy: updatedBy,
              createdAt: new Date(),
            }));

            await tx
              .insert(packageStatusHistory)
              .values(statusHistoryRecords);
          }
          break;

        case 'assign_warehouse':
          if (!data?.warehouseId) {
            throw new Error('Warehouse ID is required for assign_warehouse action');
          }

          const warehouseResult = await tx
            .update(packages)
            .set({
              warehouseId: data.warehouseId,
              updatedAt: new Date(),
            })
            .where(inArray(packages.id, packageIds))
            .returning({ id: packages.id });

          updated = warehouseResult.length;
          break;

        case 'add_note':
          if (!data?.notes) {
            throw new Error('Notes are required for add_note action');
          }

          const noteResult = await tx
            .update(packages)
            .set({
              warehouseNotes: data.notes,
              updatedAt: new Date(),
            })
            .where(inArray(packages.id, packageIds))
            .returning({ id: packages.id });

          updated = noteResult.length;
          break;

        case 'mark_ready':
          const readyResult = await tx
            .update(packages)
            .set({
              status: 'ready_to_ship' as PackageStatus,
              readyToShipAt: new Date(),
              updatedAt: new Date(),
            })
            .where(inArray(packages.id, packageIds))
            .returning({ id: packages.id });

          updated = readyResult.length;

          // Create status history records
          if (updatedBy) {
            const currentReadyPackages = await tx
              .select({ id: packages.id, status: packages.status })
              .from(packages)
              .where(inArray(packages.id, packageIds));

            const readyHistoryRecords = currentReadyPackages.map(pkg => ({
              packageId: pkg.id,
              fromStatus: pkg.status as PackageStatus,
              toStatus: 'ready_to_ship' as PackageStatus,
              changeReason: 'bulk_mark_ready',
              changedBy: updatedBy,
              createdAt: new Date(),
            }));

            await tx
              .insert(packageStatusHistory)
              .values(readyHistoryRecords);
          }
          break;

        case 'delete':
          // This is more complex and should be handled carefully
          // First check if any packages cannot be deleted
          const packagesToDelete = await tx
            .select({ id: packages.id, status: packages.status })
            .from(packages)
            .where(inArray(packages.id, packageIds));

          const cannotDelete = packagesToDelete.filter(pkg => 
            pkg.status === 'shipped' || pkg.status === 'delivered'
          );

          if (cannotDelete.length > 0) {
            failed.push(...cannotDelete.map(pkg => pkg.id));
          }

          const canDelete = packagesToDelete.filter(pkg => 
            pkg.status !== 'shipped' && pkg.status !== 'delivered'
          );

          if (canDelete.length > 0) {
            const idsToDelete = canDelete.map(pkg => pkg.id);

            // Delete status history first
            await tx
              .delete(packageStatusHistory)
              .where(inArray(packageStatusHistory.packageId, idsToDelete));

            // Delete packages
            const deleteResult = await tx
              .delete(packages)
              .where(inArray(packages.id, idsToDelete))
              .returning({ id: packages.id });

            updated = deleteResult.length;
          }
          break;

        default:
          throw new Error(`Unsupported action: ${actionType}`);
      }

      // Calculate failed packages (those that were requested but not updated)
      const updatedIds = await tx
        .select({ id: packages.id })
        .from(packages)
        .where(inArray(packages.id, packageIds));

      const updatedIdSet = new Set(updatedIds.map(p => p.id));
      const requestedButNotUpdated = packageIds.filter(id => !updatedIdSet.has(id));
      failed.push(...requestedButNotUpdated);

      return { updated, failed };

    } catch (error) {
      console.error('Error in bulk update:', error);
      // Mark all as failed if transaction fails
      return { updated: 0, failed: packageIds };
    }
  });
}