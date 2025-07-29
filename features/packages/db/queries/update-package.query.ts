// features/packages/db/queries/update-package.query.ts
import { db } from '@/lib/db';
import { packages } from '@/features/packages/db/schema/package.schema';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { eq } from 'drizzle-orm';
import type { Package, UpdatePackageData } from '../../types/package.types';
import { transformPackageWithCustomerName } from './transform-package.query';

/**
 * Update an existing package
 */
export async function updatePackage(id: string, data: UpdatePackageData): Promise<Package | null> {
  // Check if package exists
  const existingPackage = await db
    .select()
    .from(packages)
    .where(eq(packages.id, id))
    .limit(1);

  if (existingPackage.length === 0) {
    return null;
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.weight !== undefined) {
    updateData.weight = data.weight || null;
  }

  if (data.dimensions !== undefined) {
    if (data.dimensions !== null && typeof data.dimensions === 'object') {
      // Handle object format { length: number, width: number, height: number }
      const dims = data.dimensions as { length: number; width: number; height: number };
      updateData.dimensions = `${dims.length}x${dims.width}x${dims.height}cm`;
    } else {
      // Handle string or null case
      updateData.dimensions = data.dimensions;
    }
  }

  // Update package
  const [updatedPackage] = await db
    .update(packages)
    .set(updateData)
    .where(eq(packages.id, id))
    .returning();

  // Get customer name for response
  const customerResult = await db
    .select({ name: customers.name })
    .from(customers)
    .where(eq(customers.id, updatedPackage.customerId))
    .limit(1);

  const customerName = customerResult.length > 0 ? customerResult[0].name : 'Unknown Customer';

  return transformPackageWithCustomerName(updatedPackage, customerName);
}
