// features/warehouses/db/queries/storage/get-storage-charge-by-id.query.ts
import { db } from '@/lib/db';
import { storageCharges } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import { packages, binLocations, customerProfiles, users } from '@/lib/db/schema';

export async function getStorageChargeById(id: string) {
  const chargeResult = await db
    .select({
      id: storageCharges.id,
      packageId: storageCharges.packageId,
      tenantId: storageCharges.tenantId,
      chargeFromDate: storageCharges.chargeFromDate,
      chargeToDate: storageCharges.chargeToDate,
      daysCharged: storageCharges.daysCharged,
      baseStorageFee: storageCharges.baseStorageFee,
      binLocationFee: storageCharges.binLocationFee,
      totalStorageFee: storageCharges.totalStorageFee,
      currency: storageCharges.currency,
      binLocationId: storageCharges.binLocationId,
      isInvoiced: storageCharges.isInvoiced,
      invoiceId: storageCharges.invoiceId,
      dailyRate: storageCharges.dailyRate,
      freeDaysApplied: storageCharges.freeDaysApplied,
      calculatedAt: storageCharges.calculatedAt,
      calculatedBy: storageCharges.calculatedBy,
      notes: storageCharges.notes,
      // Package info
      packageInternalId: packages.internalId,
      packageTrackingNumber: packages.trackingNumberInbound,
      packageDescription: packages.description,
      packageStatus: packages.status,
      packageReceivedAt: packages.receivedAt,
      packageWeightActualKg: packages.weightActualKg,
      // Customer info
      customerId: customerProfiles.customerId,
      customerFirstName: users.firstName,
      customerLastName: users.lastName,
      customerEmail: users.email,
      // Bin info (optional)
      binCode: binLocations.binCode,
      zoneName: binLocations.zoneName,
      binDescription: binLocations.description,
      binDailyPremium: binLocations.dailyPremium,
    })
    .from(storageCharges)
    .innerJoin(packages, eq(storageCharges.packageId, packages.id))
    .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .leftJoin(binLocations, eq(storageCharges.binLocationId, binLocations.id))
    .where(eq(storageCharges.id, id))
    .limit(1);

  if (chargeResult.length === 0) {
    return null;
  }

  return chargeResult[0];
}