// features/packages/db/queries/get-packages.query.ts
import type { PackageFilters } from '../../types/package.types';
import { transformPackage } from './transform-package.query';

export async function getPackages(filters: PackageFilters = {}) {
 
  const transformedPackages: never[] = [];

  return {
    data: transformedPackages,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  };
}