// features/customers/db/queries/get-customers.query.ts
import { db } from '@/lib/db';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { packages } from '@/features/packages/db/schema/package.schema';
import { eq, ilike, and, desc, count, sql } from 'drizzle-orm';
import type { CustomerFilters } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Get customers with filters and pagination
 */
export async function getCustomers(filters: CustomerFilters = {}) {
  const { page = 1, limit = 10, status, search, country } = filters;
  
  // Build where conditions
  const conditions = [];
  
  if (status && status !== 'all') {
    conditions.push(eq(customers.status, status as any));
  }
  
  if (country) {
    conditions.push(eq(customers.country, country));
  }
  
  if (search) {
    conditions.push(
      sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.email} ILIKE ${`%${search}%`})`
    );
  }

  // Get customers with package counts
  let query = db
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
    .groupBy(customers.id);

  // Apply where conditions if any exist
  const finalQuery = conditions.length > 0 
    ? query.where(and(...conditions))
    : query;

  const allCustomers = await finalQuery.orderBy(desc(customers.createdAt));

  // Calculate pagination
  const total = allCustomers.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCustomers = allCustomers.slice(startIndex, endIndex);

  // Transform data to match frontend expectations
  const transformedCustomers = paginatedCustomers.map(transformCustomer);

  return {
    data: transformedCustomers,
    pagination: { page, limit, total, pages },
  };
}
