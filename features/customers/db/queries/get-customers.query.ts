// features/customers/db/queries/get-customers.query.ts
import { db } from '@/lib/db';
import { eq, ilike, and, desc, count, sql } from 'drizzle-orm';
import type { CustomerFilters } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Get customers with filters and pagination
 */
export async function getCustomers(filters: CustomerFilters = {}) {
  const { page = 1, limit = 10, status, search, country } = filters;
  
  // Transform data to match frontend expectations
  const transformedCustomers: never[] = [];

  return {
    data: transformedCustomers,
    pagination: { page, limit, total: 0, pages: 0 },
  };
}
