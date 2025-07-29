// features/warehouse/db/queries/warehouses/create-warehouse.query.ts
import { db } from '@/lib/db';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import type { CreateWarehouseData, Warehouse } from '@/features/warehouses/db/schema';

export async function createWarehouse(
  tenantId: string,
  data: CreateWarehouseData
): Promise<Warehouse> {
  // Check if warehouse code already exists for this tenant
  const existingWarehouse = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.code, data.code))
    .limit(1);

  if (existingWarehouse.length > 0) {
    throw new Error('Warehouse with this code already exists');
  }

  // Create new warehouse
  const newWarehouseData = {
    tenantId,
    code: data.code,
    name: data.name,
    description: data.description || null,
    countryCode: data.countryCode,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 || null,
    city: data.city,
    stateProvince: data.stateProvince || null,
    postalCode: data.postalCode,
    phone: data.phone || null,
    email: data.email || null,
    timezone: data.timezone || 'UTC',
    currencyCode: data.currencyCode,
    taxTreatment: data.taxTreatment || 'standard',
    storageFreeDays: data.storageFreeDays || 30,
    storageFeePerDay: data.storageFeePerDay || '1.00',
    maxPackageWeightKg: data.maxPackageWeightKg || '30.00',
    maxPackageValue: data.maxPackageValue || '10000.00',
    operatingHours: data.operatingHours || {},
  };

  const [newWarehouse] = await db
    .insert(warehouses)
    .values(newWarehouseData)
    .returning();

  return newWarehouse;
}