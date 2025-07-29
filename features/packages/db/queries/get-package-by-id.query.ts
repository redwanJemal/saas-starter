// features/packages/db/queries/get-package-by-id.query.ts
import { db } from '@/lib/db';
import { packages } from '@/features/packages/db/schema/package.schema';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { eq } from 'drizzle-orm';
import type { Package } from '../../types/package.types';
import { transformPackage } from './transform-package.query';

/**
 * Get a single package by ID
 */
export async function getPackageById(id: string): Promise<Package | null> {
  const packageResult = await db
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
    .where(eq(packages.id, id))
    .limit(1);

  if (packageResult.length === 0) {
    return null;
  }

  return transformPackage(packageResult[0]);
}
