// features/packages/db/queries/update-package.query.ts
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { Package, UpdatePackageData } from '../../types/package.types';
import { transformPackageWithCustomerName } from './transform-package.query';

/**
 * Update an existing package
 */
export async function updatePackage(id: string, data: UpdatePackageData): Promise<Package | null> {
  const updatedPackage: never[] = [];
  return transformPackageWithCustomerName(updatedPackage, 'Unknown Customer');
}
