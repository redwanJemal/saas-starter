// features/warehouses/db/queries/storage/get-storage-charges.query.ts
import { db } from '@/lib/db';
import { storageCharges } from '@/features/warehouses/db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { packages, binLocations, customerProfiles, users } from '@/lib/db/schema';
import type { StorageChargeFilters } from '@/features/warehouses/db/schema';

export async function getStorageCharges(filters: StorageChargeFilters = {}) {
  const { page = 1, limit = 10, packageId, chargeFromDate, chargeToDate, isInvoiced } = filters;

  // Build where conditions
  const conditions = [];
  
  if (packageId) {
    conditions.push(eq(storageCharges.packageId, packageId));
  }
  
  if (chargeFromDate) {
    conditions.push(gte(storageCharges.chargeFromDate, chargeFromDate));
  }
  
  if (chargeToDate) {
    conditions.push(lte(storageCharges.chargeToDate, chargeToDate));
  }
  
  if (isInvoiced !== undefined) {
    conditions.push(eq(storageCharges.isInvoiced, isInvoiced));
  }

  // Create base query
  const baseQuery = db
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
      // Customer info
      customerId: customerProfiles.customerId,
      customerFirstName: users.firstName,
      customerLastName: users.lastName,
      customerEmail: users.email,
      // Bin info (optional)
      binCode: binLocations.binCode,
      zoneName: binLocations.zoneName,
    })
    .from(storageCharges)
    .innerJoin(packages, eq(storageCharges.packageId, packages.id))
    .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .leftJoin(binLocations, eq(storageCharges.binLocationId, binLocations.id));

  // Apply conditions
  const finalQuery = conditions.length > 0 
    ? baseQuery.where(and(...conditions)) 
    : baseQuery;

  // Execute query with ordering
  const allCharges = await finalQuery.orderBy(desc(storageCharges.calculatedAt));

  // Calculate pagination
  const total = allCharges.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCharges = allCharges.slice(startIndex, endIndex);

  return {
    data: paginatedCharges,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}