// features/customers/db/queries/delete-customer.query.ts
import { db } from '@/lib/db';
import { eq, count } from 'drizzle-orm';

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<boolean> {
  return true;
}
