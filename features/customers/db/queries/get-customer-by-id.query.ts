// features/customers/db/queries/get-customer-by-id.query.ts
import { db } from '@/lib/db';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { packages } from '@/features/packages/db/schema/package.schema';
import { eq, count } from 'drizzle-orm';
import type { Customer } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const customerResult = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      address: customers.address,
      city: customers.city,
      state: customers.state,
      country: customers.country,
      postalCode: customers.postalCode,
      status: customers.status,
      notes: customers.notes,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      packageCount: count(packages.id),
    })
    .from(customers)
    .leftJoin(packages, eq(customers.id, packages.customerId))
    .where(eq(customers.id, id))
    .groupBy(customers.id)
    .limit(1);

  if (customerResult.length === 0) {
    return null;
  }

  return transformCustomer(customerResult[0]);
}
