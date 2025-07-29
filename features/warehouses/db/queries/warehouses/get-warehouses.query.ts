// features/warehouse/db/queries/warehouses/get-warehouses.query.ts
import { db } from '@/lib/db';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import type { WarehouseFilters } from '@/features/warehouses/db/schema';

export async function getWarehouses(filters: WarehouseFilters = {}) {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    countryCode, 
    acceptsNewPackages, 
    search 
  } = filters;

  // Build where conditions
  const conditions = [];

  if (status) {
    conditions.push(eq(warehouses.status, status));
  }

  if (countryCode) {
    conditions.push(eq(warehouses.countryCode, countryCode));
  }

  if (acceptsNewPackages !== undefined) {
    conditions.push(eq(warehouses.acceptsNewPackages, acceptsNewPackages));
  }

  if (search) {
    conditions.push(
      sql`(${warehouses.name} ILIKE ${`%${search}%`} OR ${warehouses.code} ILIKE ${`%${search}%`} OR ${warehouses.city} ILIKE ${`%${search}%`})`
    );
  }

  // Create base query
  const baseQuery = db
    .select({
      id: warehouses.id,
      tenantId: warehouses.tenantId,
      code: warehouses.code,
      name: warehouses.name,
      description: warehouses.description,
      countryCode: warehouses.countryCode,
      addressLine1: warehouses.addressLine1,
      addressLine2: warehouses.addressLine2,
      city: warehouses.city,
      stateProvince: warehouses.stateProvince,
      postalCode: warehouses.postalCode,
      phone: warehouses.phone,
      email: warehouses.email,
      timezone: warehouses.timezone,
      currencyCode: warehouses.currencyCode,
      taxTreatment: warehouses.taxTreatment,
      storageFreeDays: warehouses.storageFreeDays,
      storageFeePerDay: warehouses.storageFeePerDay,
      maxPackageWeightKg: warehouses.maxPackageWeightKg,
      maxPackageValue: warehouses.maxPackageValue,
      status: warehouses.status,
      acceptsNewPackages: warehouses.acceptsNewPackages,
      operatingHours: warehouses.operatingHours,
      createdAt: warehouses.createdAt,
      updatedAt: warehouses.updatedAt,
    })
    .from(warehouses);

  // Apply conditions
  const finalQuery = conditions.length > 0 
    ? baseQuery.where(and(...conditions))
    : baseQuery;

  // Execute query with ordering
  const allWarehouses = await finalQuery.orderBy(desc(warehouses.createdAt));

  // Calculate pagination
  const total = allWarehouses.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedWarehouses = allWarehouses.slice(startIndex, endIndex);

  return {
    data: paginatedWarehouses,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}