// features/packages/db/queries/update-packages-status.query.ts
import { db } from '@/lib/db';
import { packages } from '@/features/packages/db/schema/package.schema';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { inArray, eq } from 'drizzle-orm';
import type { PackageStatus } from '../../types/package.types';
import { transformPackageWithCustomerName } from './transform-package.query';

/**
 * Update status of multiple packages at once
 */
export async function updatePackagesStatus(ids: string[], status: PackageStatus) {
  // Check if all packages exist
  const existingPackages = await db
    .select({ id: packages.id })
    .from(packages)
    .where(inArray(packages.id, ids));

  if (existingPackages.length !== ids.length) {
    return {
      success: false,
      message: 'One or more packages not found',
      status: 404
    };
  }

  // Update package statuses
  const updatedPackages = await db
    .update(packages)
    .set({
      status: status,
      updatedAt: new Date(),
    })
    .where(inArray(packages.id, ids))
    .returning();

  // Get updated packages with customer information
  const packagesWithCustomers = await db
    .select({
      package: packages,
      customerName: customers.name,
    })
    .from(packages)
    .leftJoin(customers, eq(packages.customerId, customers.id))
    .where(inArray(packages.id, ids));

  // Transform data to match frontend expectations
  const transformedPackages = packagesWithCustomers.map((result) => 
    transformPackageWithCustomerName(result.package, result.customerName || 'Unknown Customer')
  );

  return {
    success: true,
    data: transformedPackages,
    message: `Successfully updated ${updatedPackages.length} packages to ${status}`,
  };
}
