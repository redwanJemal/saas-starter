// features/packages/db/queries/create-package.query.ts
import { db } from '@/lib/db';
import { packages } from '@/features/packages/db/schema/package.schema';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { eq } from 'drizzle-orm';
import type { Package, CreatePackageData } from '../../types/package.types';
import { transformPackageWithCustomerName } from './transform-package.query';

/**
 * Create a new package
 */
export async function createPackage(data: CreatePackageData): Promise<Package> {
  // Check if customer exists
  const customerExists = await db
    .select()
    .from(customers)
    .where(eq(customers.id, data.customerId))
    .limit(1);

  if (customerExists.length === 0) {
    throw new Error('Customer not found');
  }

  // Check if tracking number already exists
  const existingPackage = await db
    .select()
    .from(packages)
    .where(eq(packages.trackingNumber, data.trackingNumber))
    .limit(1);

  if (existingPackage.length > 0) {
    throw new Error('Package with this tracking number already exists');
  }

  // Create new package
  const newPackageData = {
    trackingNumber: data.trackingNumber,
    customerId: data.customerId,
    status: data.status || 'pending' as const,
    weight: data.weight || null,
    dimensions: data.dimensions || null,
    origin: data.origin || null,
    destination: data.destination,
    estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
  };

  const [newPackage] = await db
    .insert(packages)
    .values(newPackageData)
    .returning();

  // Get customer name for response
  const customer = customerExists[0];

  return transformPackageWithCustomerName(newPackage, customer.name);
}
