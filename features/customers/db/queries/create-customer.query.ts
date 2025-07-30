// features/customers/db/queries/create-customer.query.ts
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { Customer, CreateCustomerData } from '../../types/customer.types';
import { transformCustomer } from './transform-customer.query';

/**
 * Create a new customer
 */
export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
  // Check if email already exists
  const newCustomer: Customer = {
    id: 'cust_' + Math.random().toString(36).substr(2, 9), // Generate a random ID
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    country: data.country || null,
    postalCode: data.postalCode || null,
    status: 'active', // Default status
    notes: data.notes || null,
    packageCount: 0, // Initial value for new customer
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return newCustomer;
}