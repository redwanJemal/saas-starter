// features/warehouses/db/queries/bins/get-package-bin-assignment-by-id.query.ts
import { db } from '@/lib/db';
import { packageBinAssignments, binLocations } from '@/features/warehouses/db/schema';
import { eq } from 'drizzle-orm';
import { customerProfiles, packages, users } from '@/lib/db/schema';

export async function getPackageBinAssignmentById(id: string) {
  const assignmentResult = await db
    .select({
      id: packageBinAssignments.id,
      packageId: packageBinAssignments.packageId,
      binId: packageBinAssignments.binId,
      assignedAt: packageBinAssignments.assignedAt,
      removedAt: packageBinAssignments.removedAt,
      assignmentReason: packageBinAssignments.assignmentReason,
      removalReason: packageBinAssignments.removalReason,
      notes: packageBinAssignments.notes,
      assignedBy: packageBinAssignments.assignedBy,
      removedBy: packageBinAssignments.removedBy,
      // Package info
      packageInternalId: packages.internalId,
      packageTrackingNumber: packages.trackingNumberInbound,
      packageDescription: packages.description,
      packageStatus: packages.status,
      packageWeightActualKg: packages.weightActualKg,
      // Customer info
      customerId: customerProfiles.customerId,
      customerFirstName: users.firstName,
      customerLastName: users.lastName,
      customerEmail: users.email,
      // Bin info
      binCode: binLocations.binCode,
      zoneName: binLocations.zoneName,
      warehouseId: binLocations.warehouseId,
      binDescription: binLocations.description,
      binMaxCapacity: binLocations.maxCapacity,
      isClimateControlled: binLocations.isClimateControlled,
      isSecured: binLocations.isSecured,
    })
    .from(packageBinAssignments)
    .innerJoin(packages, eq(packageBinAssignments.packageId, packages.id))
    .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .innerJoin(binLocations, eq(packageBinAssignments.binId, binLocations.id))
    .where(eq(packageBinAssignments.id, id))
    .limit(1);

  if (assignmentResult.length === 0) {
    return null;
  }

  return assignmentResult[0];
}