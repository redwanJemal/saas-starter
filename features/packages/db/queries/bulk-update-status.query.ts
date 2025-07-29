// features/packages/db/queries/bulk-update-status.query.ts
import { db } from '@/lib/db';
import { packages } from '@/features/packages/db/schema/package.schema';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { eq, inArray } from 'drizzle-orm';
import type { Package } from '../../types/package.types';
import { transformPackage } from './transform-package.query';

/**
 * Update package status (bulk operation)
 */
export async function bulkUpdateStatus(ids: string[], status: string): Promise<Package[]> {
  // Validate status
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'returned'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status value');
  }

  // Check if all packages exist
  const existingPackages = await db
    .select({ id: packages.id })
    .from(packages)
    .where(inArray(packages.id, ids));

  if (existingPackages.length !== ids.length) {
    throw new Error('One or more packages not found');
  }

  // Update package statuses
  await db
    .update(packages)
    .set({
      status: status as any,
      updatedAt: new Date(),
    })
    .where(inArray(packages.id, ids));

  // Get updated packages with customer information
  const updatedPackages = await db
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
    .where(inArray(packages.id, ids));

  return updatedPackages.map(transformPackage);
}
