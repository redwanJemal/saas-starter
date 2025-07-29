import { db } from '../index';
import { customers, type CustomerStatus } from '@/features/customers/db/schema/customer.schema';
import type { NewCustomer } from '@/features/customers/db/schema/customer.schema';

export async function seedCustomers() {
  console.log('👥 Seeding customers...');
  
  const seedData: NewCustomer[] = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001',
      status: 'active',
      notes: 'VIP customer with multiple packages',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0456',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      postalCode: '90210',
      status: 'active',
      notes: 'Regular customer',
    },
    {
      name: 'Bob Wilson',
      email: 'bob.wilson@example.com',
      phone: '+1-555-0789',
      address: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60601',
      status: 'inactive',
      notes: 'Inactive customer - follow up needed',
    },
  ];

  // Clear existing data
  await db.delete(customers);
  
  // Insert new data
  const result = await db.insert(customers).values(seedData).returning();
  
  console.log(`✅ Created ${result.length} customers`);
  return result;
}
