// features/warehouses/db/queries/bins/get-package-bin-assignments.query.ts
import { db } from '@/lib/db';
import { packageBinAssignments, binLocations } from '@/features/warehouses/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { customerProfiles, packages, users } from '@/lib/db/schema';

interface PackageBinAssignmentFilters {
  page?: number;
  limit?: number;
  binId?: string;
  packageId?: string;
  warehouseId?: string;
  activeOnly?: boolean;
}

export async function getPackageBinAssignments(filters: PackageBinAssignmentFilters = {}) {
  const { page = 1, limit = 10, binId, packageId, warehouseId, activeOnly = true } = filters;

  // Build where conditions
  const conditions = [];
  
  if (binId) {
    conditions.push(eq(packageBinAssignments.binId, binId));
  }
  
  if (packageId) {
    conditions.push(eq(packageBinAssignments.packageId, packageId));
  }
  
  if (warehouseId) {
    conditions.push(eq(binLocations.warehouseId, warehouseId));
  }
  
  if (activeOnly) {
    conditions.push(isNull(packageBinAssignments.removedAt));
  }

  // Create base query
  const baseQuery = db
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
      // Customer info
      customerId: customerProfiles.customerId,
      customerFirstName: users.firstName,
      customerLastName: users.lastName,
      // Bin info
      binCode: binLocations.binCode,
      zoneName: binLocations.zoneName,
      warehouseId: binLocations.warehouseId,
    })
    .from(packageBinAssignments)
    .innerJoin(packages, eq(packageBinAssignments.packageId, packages.id))
    .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .innerJoin(binLocations, eq(packageBinAssignments.binId, binLocations.id));

  // Apply conditions
  const finalQuery = conditions.length > 0 
    ? baseQuery.where(and(...conditions)) 
    : baseQuery;

  // Execute query with ordering
  const allAssignments = await finalQuery.orderBy(desc(packageBinAssignments.assignedAt));

  // Calculate pagination
  const total = allAssignments.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedAssignments = allAssignments.slice(startIndex, endIndex);

  return {
    data: paginatedAssignments,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}