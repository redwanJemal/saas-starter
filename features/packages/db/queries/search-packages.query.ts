// features/packages/db/queries/search-packages.query.ts
import { db } from '@/lib/db';
import { packages } from '@/features/packages/db/schema/package.schema';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { Package } from '../../types/package.types';
import { transformPackage } from './transform-package.query';

/**
 * Search packages
 */
export async function searchPackages(query: string): Promise<Package[]> {
  const searchResults = await db
    .select({
      id: packages.id,
      trackingNumber: packages.trackingNumber,
      customerId: packages.customerId,
      customerName: customers.name,
      status: packages.status,
      weight: packages.weight,
      dimensions: packages.dimensions,
      origin: packages.origin,
      destination: packages.destination,
      estimatedDelivery: packages.estimatedDelivery,
      createdAt: packages.createdAt,
      updatedAt: packages.updatedAt,
    })
    .from(packages)
    .leftJoin(customers, eq(packages.customerId, customers.id))
    .where(
      sql`(${packages.trackingNumber} ILIKE ${`%${query}%`} OR ${customers.name} ILIKE ${`%${query}%`})`
    )
    .orderBy(desc(packages.createdAt))
    .limit(20);

  return searchResults.map(transformPackage);
}
