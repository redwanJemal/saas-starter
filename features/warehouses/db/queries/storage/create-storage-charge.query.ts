// features/warehouses/db/queries/storage/create-storage-charge.query.ts
import { db } from '@/lib/db';
import { storageCharges } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import type { CreateStorageChargeData, StorageCharge } from '@/features/warehouses/db/schema';
import { packages } from '@/lib/db/schema';

export async function createStorageCharge(
  tenantId: string,
  data: CreateStorageChargeData,
  calculatedBy: string
): Promise<StorageCharge> {
  // Validate package exists
  const packageExists = await db
    .select({ id: packages.id, tenantId: packages.tenantId })
    .from(packages)
    .where(eq(packages.id, data.packageId))
    .limit(1);

  if (packageExists.length === 0) {
    throw new Error('Package not found');
  }

  if (packageExists[0].tenantId !== tenantId) {
    throw new Error('Package does not belong to this tenant');
  }

  // Create new storage charge
  const newChargeData = {
    packageId: data.packageId,
    tenantId,
    chargeFromDate: new Date(data.chargeFromDate).toISOString(),
    chargeToDate: new Date(data.chargeToDate).toISOString(),
    daysCharged: data.daysCharged,
    baseStorageFee: data.baseStorageFee,
    binLocationFee: data.binLocationFee || '0.00',
    totalStorageFee: data.totalStorageFee,
    currency: data.currency || 'USD',
    binLocationId: data.binLocationId || null,
    isInvoiced: false,
    invoiceId: null,
    dailyRate: data.dailyRate,
    freeDaysApplied: data.freeDaysApplied || 0,
    calculatedAt: new Date(),
    calculatedBy,
    notes: data.notes || null,
  };

  const [newCharge] = await db
    .insert(storageCharges)
    .values(newChargeData)
    .returning();

  return newCharge;
}