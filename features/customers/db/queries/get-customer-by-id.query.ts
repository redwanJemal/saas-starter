// features/customers/db/queries/get-customer-by-id.query.ts
import { db } from '@/lib/db';
import { eq, count } from 'drizzle-orm';
import type { Customer } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  return null;
}
