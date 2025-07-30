// features/packages/db/queries/create-package.query.ts
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { Package, CreatePackageData } from '../../types/package.types';
import { transformPackageWithCustomerName } from './transform-package.query';

/**
 * Create a new package
 */
export async function createPackage(data: CreatePackageData): Promise<Package> {
 return transformPackageWithCustomerName(data, 'Unknown Customer');
}
