// features/customers/db/queries/delete-customer.query.ts
import { db } from '@/lib/db';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { packages } from '@/features/packages/db/schema/package.schema';
import { eq, count } from 'drizzle-orm';

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<boolean> {
  // Check if customer exists
  const existingCustomer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (existingCustomer.length === 0) {
    return false;
  }

  // Check if customer has packages
  const packageCount = await db
    .select({ count: count() })
    .from(packages)
    .where(eq(packages.customerId, id));

  if (packageCount[0].count > 0) {
    throw new Error('Cannot delete customer with existing packages');
  }

  // Delete customer
  await db.delete(customers).where(eq(customers.id, id));
  return true;
}
