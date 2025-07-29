import { db } from '../index';
import { packages, type PackageStatus } from '@/features/packages/schema/package.schema';
import type { Customer } from '@/features/customers/schema/customer.schema';
import type { NewPackage } from '@/features/packages/schema/package.schema';

export async function seedPackages(customers: Customer[]) {
  console.log('📦 Seeding packages...');
  
  if (customers.length === 0) {
    throw new Error('No customers found. Please seed customers first.');
  }

  const seedData: NewPackage[] = [
    {
      trackingNumber: 'PKG001',
      customerId: customers[0].id, // First customer (John Doe)
      status: 'pending',
      weight: '2.5kg',
      dimensions: '20x15x10cm',
      origin: 'Amazon Warehouse',
      destination: 'New York, NY',
      estimatedDelivery: new Date('2024-02-15'),
    },
    {
      trackingNumber: 'PKG002',
      customerId: customers[1].id, // Second customer (Jane Smith)
      status: 'processing',
      weight: '1.2kg',
      dimensions: '15x10x8cm',
      origin: 'eBay Seller',
      destination: 'Los Angeles, CA',
      estimatedDelivery: new Date('2024-02-18'),
    },
    {
      trackingNumber: 'PKG003',
      customerId: customers[0].id, // First customer (John Doe) - second package
      status: 'shipped',
      weight: '3.8kg',
      dimensions: '25x20x15cm',
      origin: 'Walmart Store',
      destination: 'New York, NY',
      estimatedDelivery: new Date('2024-02-20'),
    },
    {
      trackingNumber: 'PKG004',
      customerId: customers[2].id, // Third customer (Bob Wilson)
      status: 'delivered',
      weight: '0.8kg',
      dimensions: '12x8x5cm',
      origin: 'Target Store',
      destination: 'Chicago, IL',
      estimatedDelivery: new Date('2024-01-25'),
    },
  ];

  // Clear existing data
  await db.delete(packages);
  
  // Insert new data
  const result = await db.insert(packages).values(seedData).returning();
  
  console.log(`✅ Created ${result.length} packages`);
  return result;
}
