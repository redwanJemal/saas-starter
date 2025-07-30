// features/warehouses/db/queries/storage/get-unbilled-storage-charges.query.ts
import { db } from '@/lib/db';
import { storageCharges } from '@/features/warehouses/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { customerProfiles, packages, users } from '@/lib/db/schema';

export async function getUnbilledStorageCharges(tenantId?: string) {
    // Build where conditions
    const conditions = [eq(storageCharges.isInvoiced, false)];
    
    if (tenantId) {
      conditions.push(eq(storageCharges.tenantId, tenantId));
    }
  
    const unbilledCharges = await db
      .select({
        id: storageCharges.id,
        packageId: storageCharges.packageId,
        tenantId: storageCharges.tenantId,
        chargeFromDate: storageCharges.chargeFromDate,
        chargeToDate: storageCharges.chargeToDate,
        daysCharged: storageCharges.daysCharged,
        totalStorageFee: storageCharges.totalStorageFee,
        currency: storageCharges.currency,
        calculatedAt: storageCharges.calculatedAt,
        // Package info
        packageInternalId: packages.internalId,
        packageTrackingNumber: packages.trackingNumberInbound,
        packageDescription: packages.description,
        // Customer info
        customerId: customerProfiles.customerId,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerEmail: users.email,
      })
      .from(storageCharges)
      .innerJoin(packages, eq(storageCharges.packageId, packages.id))
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(storageCharges.calculatedAt));
  
    return unbilledCharges;
  }