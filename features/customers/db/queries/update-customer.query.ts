// features/customers/db/queries/update-customer.query.ts
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { Customer, UpdateCustomerData } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Update an existing customer
 */
export async function updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer | null> {
 
  return transformCustomer({
    ...data,
    packageCount: 0, // We'll get this from a separate query in getCustomerById
  });
}
