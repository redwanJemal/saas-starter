// features/customers/db/queries/search-customers.query.ts
import { db } from '@/lib/db';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { packages } from '@/features/packages/db/schema/package.schema';
import { eq, ilike, or, desc, count, sql } from 'drizzle-orm';
import type { Customer } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Search customers
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
  const searchResults = await db
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
    .where(
      sql`(${customers.name} ILIKE ${`%${query}%`} OR ${customers.email} ILIKE ${`%${query}%`})`
    )
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt))
    .limit(20);

  return searchResults.map(transformCustomer);
}
