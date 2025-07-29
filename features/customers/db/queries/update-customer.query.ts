// features/customers/db/queries/update-customer.query.ts
import { db } from '@/lib/db';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { eq } from 'drizzle-orm';
import type { Customer, UpdateCustomerData } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Update an existing customer
 */
export async function updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer | null> {
  // Check if customer exists
  const existingCustomer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (existingCustomer.length === 0) {
    return null;
  }

  // Check if email is being changed and already exists
  if (data.email && data.email !== existingCustomer[0].email) {
    const emailExists = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email))
      .limit(1);

    if (emailExists.length > 0) {
      throw new Error('Customer with this email already exists');
    }
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.name) {
    updateData.name = data.name;
  }

  if (data.email) {
    updateData.email = data.email;
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone || null;
  }

  if (data.address !== undefined) {
    updateData.address = data.address;
  }
  
  if (data.city !== undefined) {
    updateData.city = data.city;
  }
  
  if (data.state !== undefined) {
    updateData.state = data.state;
  }
  
  if (data.country !== undefined) {
    updateData.country = data.country;
  }
  
  if (data.postalCode !== undefined) {
    updateData.postalCode = data.postalCode;
  }
  
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  if (data.status) {
    updateData.status = data.status;
  }

  // Update customer
  const [updatedCustomer] = await db
    .update(customers)
    .set(updateData)
    .where(eq(customers.id, id))
    .returning();

  return transformCustomer({
    ...updatedCustomer,
    packageCount: 0, // We'll get this from a separate query in getCustomerById
  });
}
