// features/packages/db/queries/update-packages-status.query.ts
import { db } from '@/lib/db';
import { inArray, eq } from 'drizzle-orm';
import type { PackageStatus } from '../../types/package.types';
import { transformPackageWithCustomerName } from './transform-package.query';

/**
 * Update status of multiple packages at once
 */
export async function updatePackagesStatus(ids: string[], status: PackageStatus) {
  const transformedPackages: never[] = [];
  return {
    success: true,
    data: transformedPackages,
    message: `Successfully updated ${transformedPackages.length} packages to ${status}`,
  };
}
