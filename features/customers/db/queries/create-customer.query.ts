// features/customers/db/queries/create-customer.query.ts
import { db } from '@/lib/db';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { eq } from 'drizzle-orm';
import type { Customer, CreateCustomerData } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Create a new customer
 */
export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
  // Check if email already exists
  const existingCustomer = await db
    .select()
    .from(customers)
    .where(eq(customers.email, data.email))
    .limit(1);

  if (existingCustomer.length > 0) {
    throw new Error('Customer with this email already exists');
  }

  // Create new customer
  const newCustomerData = {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
    postalCode: data.postalCode || null,
    status: data.status || 'pending',
    notes: data.notes || null,
  };

  const [newCustomer] = await db
    .insert(customers)
    .values(newCustomerData)
    .returning();

  // Transform response using the common transformer
  return transformCustomer({
    ...newCustomer,
    packageCount: 0
  });
}
