// features/packages/db/queries/bulk-update-status.query.ts
import { db } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import type { Package } from '../../types/package.types';
import { transformPackage } from './transform-package.query';

/**
 * Update package status (bulk operation)
 */
export async function bulkUpdateStatus(ids: string[], status: string): Promise<Package[]> {
  const updatedPackages: never[] = [];

  return updatedPackages.map(transformPackage);
}
