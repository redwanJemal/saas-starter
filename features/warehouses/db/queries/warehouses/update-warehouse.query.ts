// features/warehouse/db/queries/warehouses/update-warehouse.query.ts
import { db } from '@/lib/db';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateWarehouseData, Warehouse } from '@/features/warehouses/db/schema';

export async function updateWarehouse(
  id: string,
  data: UpdateWarehouseData
): Promise<Warehouse | null> {
  // Check if warehouse exists
  const existingWarehouse = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.id, id))
    .limit(1);

  if (existingWarehouse.length === 0) {
    return null;
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  // Only update fields that are provided
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1;
  if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.stateProvince !== undefined) updateData.stateProvince = data.stateProvince;
  if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.acceptsNewPackages !== undefined) updateData.acceptsNewPackages = data.acceptsNewPackages;
  if (data.taxTreatment !== undefined) updateData.taxTreatment = data.taxTreatment;
  if (data.storageFreeDays !== undefined) updateData.storageFreeDays = data.storageFreeDays;
  if (data.storageFeePerDay !== undefined) updateData.storageFeePerDay = data.storageFeePerDay;
  if (data.maxPackageWeightKg !== undefined) updateData.maxPackageWeightKg = data.maxPackageWeightKg;
  if (data.maxPackageValue !== undefined) updateData.maxPackageValue = data.maxPackageValue;
  if (data.operatingHours !== undefined) updateData.operatingHours = data.operatingHours;

  // Update warehouse
  const [updatedWarehouse] = await db
    .update(warehouses)
    .set(updateData)
    .where(eq(warehouses.id, id))
    .returning();

  return updatedWarehouse;
}