// features/customers/db/queries/search-customers.query.ts
import { db } from '@/lib/db';
import { eq, ilike, or, desc, count, sql } from 'drizzle-orm';
import type { Customer } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Search customers
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
  const searchResults: never[] = [];
  return searchResults;
}
