// features/packages/db/queries/get-packages.query.ts
import { db } from '@/lib/db';
import { packages } from '@/features/packages/db/schema/package.schema';
import { customers } from '@/features/customers/db/schema/customer.schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { PackageFilters } from '../../types/package.types';
import { transformPackage } from './transform-package.query';

export async function getPackages(filters: PackageFilters = {}) {
  const { page = 1, limit = 10, status, search, customerId } = filters;
  
  const conditions = [];
  
  if (status && status !== 'all') {
    conditions.push(eq(packages.status, status as any));
  }
  
  if (customerId) {
    conditions.push(eq(packages.customerId, customerId));
  }
  
  if (search) {
    conditions.push(
      sql`(${packages.trackingNumber} ILIKE ${`%${search}%`} OR ${customers.name} ILIKE ${`%${search}%`})`
    );
  }

  // Create base query without where clause
  const baseQuery = db
    .select({
      id: packages.id,
      trackingNumber: packages.trackingNumber,
      customerId: packages.customerId,
      customerName: customers.name,
      status: packages.status,
      weight: packages.weight,
      dimensions: packages.dimensions,
      origin: packages.origin,
      destination: packages.destination,
      estimatedDelivery: packages.estimatedDelivery,
      createdAt: packages.createdAt,
      updatedAt: packages.updatedAt,
    })
    .from(packages)
    .leftJoin(customers, eq(packages.customerId, customers.id));

  // Apply conditions to the base query
  const finalQuery = conditions.length > 0
    ? baseQuery.where(and(...conditions))
    : baseQuery;

  // Add ordering to the final query
  const orderedQuery = finalQuery.orderBy(desc(packages.createdAt));
  
  const allPackages = await orderedQuery;

  // Pagination logic remains the same
  const total = allPackages.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPackages = allPackages.slice(startIndex, endIndex);

  const transformedPackages = paginatedPackages.map(transformPackage);

  return {
    data: transformedPackages,
    pagination: { page, limit, total, pages },
  };
}