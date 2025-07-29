// features/warehouse/db/queries/storage/calculate-storage-charges.query.ts
import { db } from '@/lib/db';
import { storageCharges, storagePricing, packageBinAssignments, binLocations } from '@/features/warehouses/db/schema';
import { eq, and, lte, gte, isNull, sql } from 'drizzle-orm';
import type { CreateStorageChargeData } from '@/features/warehouses/db/schema';

interface StorageCalculationParams {
  packageId: string;
  warehouseId: string;
  tenantId: string;
  fromDate: string;
  toDate: string;
}

export async function calculateStorageCharges(params: StorageCalculationParams) {
  const { packageId, warehouseId, tenantId, fromDate, toDate } = params;

  // Get active storage pricing for the warehouse
  const pricingResult = await db
    .select()
    .from(storagePricing)
    .where(
      and(
        eq(storagePricing.tenantId, tenantId),
        eq(storagePricing.warehouseId, warehouseId),
        eq(storagePricing.isActive, true),
        lte(storagePricing.effectiveFrom, fromDate),
        sql`(${storagePricing.effectiveUntil} IS NULL OR ${storagePricing.effectiveUntil} >= ${toDate})`
      )
    )
    .limit(1);

  if (pricingResult.length === 0) {
    throw new Error('No active storage pricing found for this warehouse');
  }

  const pricing = pricingResult[0];

  // Calculate number of days
  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);
  const timeDiff = endDate.getTime() - startDate.getTime();
  const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (totalDays <= 0) {
    throw new Error('Invalid date range for storage calculation');
  }

  // Calculate chargeable days (after free period)
  const freeDaysApplied = Math.min(totalDays, pricing.freeDays);
  const chargeableDays = Math.max(0, totalDays - pricing.freeDays);

  // Get bin location details for premium charges
  const binAssignmentResult = await db
    .select({
      binLocationId: packageBinAssignments.binId,
      dailyPremium: binLocations.dailyPremium,
      currency: binLocations.currency,
    })
    .from(packageBinAssignments)
    .leftJoin(binLocations, eq(packageBinAssignments.binId, binLocations.id))
    .where(
      and(
        eq(packageBinAssignments.packageId, packageId),
        isNull(packageBinAssignments.removedAt), // Currently assigned
        lte(packageBinAssignments.assignedAt, new Date(toDate))
      )
    )
    .limit(1);

  // Calculate fees
  const dailyRate = parseFloat(pricing.dailyRateAfterFree);
  const baseStorageFee = chargeableDays * dailyRate;
  
  let binLocationFee = 0;
  let binLocationId = null;

  if (binAssignmentResult.length > 0 && binAssignmentResult[0].dailyPremium) {
    const premiumRate = parseFloat(binAssignmentResult[0].dailyPremium);
    binLocationFee = chargeableDays * premiumRate;
    binLocationId = binAssignmentResult[0].binLocationId;
  }

  const totalStorageFee = baseStorageFee + binLocationFee;

  // Create storage charge record
  const storageChargeData: CreateStorageChargeData = {
    packageId,
    chargeFromDate: fromDate,
    chargeToDate: toDate,
    daysCharged: chargeableDays,
    baseStorageFee: baseStorageFee.toFixed(2),
    binLocationFee: binLocationFee.toFixed(2),
    totalStorageFee: totalStorageFee.toFixed(2),
    currency: pricing.currency,
    binLocationId: binLocationId ?? undefined,
    dailyRate: dailyRate.toFixed(2),
    freeDaysApplied,
    notes: `Storage charge calculated for ${totalDays} total days, ${freeDaysApplied} free days applied, ${chargeableDays} chargeable days`,
  };

  const [newStorageCharge] = await db
    .insert(storageCharges)
    .values({
      ...storageChargeData,
      tenantId,
    })
    .returning();

  return {
    storageCharge: newStorageCharge,
    calculation: {
      totalDays,
      freeDaysApplied,
      chargeableDays,
      baseStorageFee,
      binLocationFee,
      totalStorageFee,
      dailyRate,
      currency: pricing.currency,
    },
  };
}