// features/packages/db/queries/search-packages.query.ts
import { db } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import type { Package } from '../../types/package.types';
import { transformPackage } from './transform-package.query';

/**
 * Search packages
 */
export async function searchPackages(query: string): Promise<Package[]> {
  const searchResults: never[] = [];

  return searchResults.map(transformPackage);
}
