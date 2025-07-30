// features/packages/db/queries/transform-package.query.ts
import type { Package } from '../../types/package.types';

/**
 * Transform a database package record into the expected API format
 * with customer name included
 */
export function transformPackageWithCustomerName(
  packageData: any,
  customerName: string
): Package {
  return {
    id: packageData.id,
    trackingNumber: packageData.trackingNumber,
    customerId: packageData.customerId,
    customerName,
    status: packageData.status,
    weight: packageData.weight,
    dimensions: packageData.dimensions,
    origin: packageData.origin,
    destination: packageData.destination,
    estimatedDelivery: packageData.estimatedDelivery?.toISOString() || null,
    createdAt: packageData.createdAt.toISOString(),
    updatedAt: packageData.updatedAt.toISOString(),
  };
}

/**
 * Transform a database package record into the expected API format
 */
export function transformPackage(packageData: any): Package {
  return {
    id: packageData.id,
    trackingNumber: packageData.trackingNumber,
    customerId: packageData.customerId,
    status: packageData.status,
    weight: packageData.weight,
    dimensions: packageData.dimensions,
    origin: packageData.origin,
    destination: packageData.destination,
    estimatedDelivery: packageData.estimatedDelivery?.toISOString() || null,
    createdAt: packageData.createdAt.toISOString(),
    updatedAt: packageData.updatedAt.toISOString(),
  };
}
