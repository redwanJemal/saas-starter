// features/packages/db/queries/get-package-by-id.query.ts
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { Package } from '../../types/package.types';
import { transformPackage } from './transform-package.query';

/**
 * Get a single package by ID
 */
export async function getPackageById(id: string): Promise<Package | null> {
  return transformPackage({
    id,
    trackingNumber: 'Unknown Tracking Number',
    customerId: 'Unknown Customer ID',
    customerName: 'Unknown Customer Name',
    status: 'Unknown Status',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    origin: 'Unknown Origin',
    destination: 'Unknown Destination',
    estimatedDelivery: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
