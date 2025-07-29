// features/customers/db/queries/transform-customer.query.ts
import type { Customer } from '../../types/customer.types';

/**
 * Transform database customer to frontend format
 */
export function transformCustomer(customer: any): Customer {
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    country: customer.country || '',
    postalCode: customer.postalCode || '',
    status: customer.status,
    packageCount: customer.packageCount || 0,
    notes: customer.notes,
    createdAt: customer.createdAt?.toISOString() || '',
    updatedAt: customer.updatedAt?.toISOString() || '',
  };
}
