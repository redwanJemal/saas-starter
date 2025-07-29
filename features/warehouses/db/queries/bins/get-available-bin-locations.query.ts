// features/warehouse/db/queries/bins/get-available-bin-locations.query.ts
import { db } from '@/lib/db';
import { binLocations, packageBinAssignments } from '@/features/warehouses/db/schema';
import { eq, and, count, isNull, sql } from 'drizzle-orm';

interface AvailableBinLocationFilters {
  warehouseId: string;
  zoneName?: string;
  minCapacity?: number;
  maxWeightKg?: number;
  isClimateControlled?: boolean;
  isSecured?: boolean;
}

export async function getAvailableBinLocations(filters: AvailableBinLocationFilters) {
  const { warehouseId, zoneName, minCapacity, maxWeightKg, isClimateControlled, isSecured } = filters;

  // Build base query with current occupancy calculation
  const query = db
    .select({
      id: binLocations.id,
      tenantId: binLocations.tenantId,
      warehouseId: binLocations.warehouseId,
      binCode: binLocations.binCode,
      zoneName: binLocations.zoneName,
      description: binLocations.description,
      maxCapacity: binLocations.maxCapacity,
      currentOccupancy: sql<number>`COALESCE(${
        db
          .select({ count: count() })
          .from(packageBinAssignments)
          .where(
            and(
              eq(packageBinAssignments.binId, binLocations.id),
              isNull(packageBinAssignments.removedAt)
            )
          )
      }, 0)`.as('currentOccupancy'),
      maxWeightKg: binLocations.maxWeightKg,
      dailyPremium: binLocations.dailyPremium,
      currency: binLocations.currency,
      isClimateControlled: binLocations.isClimateControlled,
      isSecured: binLocations.isSecured,
      isAccessible: binLocations.isAccessible,
      availableCapacity: sql<number>`${binLocations.maxCapacity} - COALESCE(${
        db
          .select({ count: count() })
          .from(packageBinAssignments)
          .where(
            and(
              eq(packageBinAssignments.binId, binLocations.id),
              isNull(packageBinAssignments.removedAt)
            )
          )
      }, 0)`.as('availableCapacity'),
      createdAt: binLocations.createdAt,
      updatedAt: binLocations.updatedAt,
    })
    .from(binLocations);

  // Build where conditions
  const conditions = [
    eq(binLocations.warehouseId, warehouseId),
    eq(binLocations.isActive, true),
    // Only show bins with available capacity
    sql`${binLocations.maxCapacity} > COALESCE(${
      db
        .select({ count: count() })
        .from(packageBinAssignments)
        .where(
          and(
            eq(packageBinAssignments.binId, binLocations.id),
            isNull(packageBinAssignments.removedAt)
          )
        )
    }, 0)`,
  ];

  if (zoneName) {
    conditions.push(eq(binLocations.zoneName, zoneName));
  }

  if (minCapacity) {
    conditions.push(sql`${binLocations.maxCapacity} >= ${minCapacity}`);
  }

  if (maxWeightKg) {
    conditions.push(
      sql`(${binLocations.maxWeightKg} IS NULL OR ${binLocations.maxWeightKg} >= ${maxWeightKg})`
    );
  }

  if (isClimateControlled !== undefined) {
    conditions.push(eq(binLocations.isClimateControlled, isClimateControlled));
  }

  if (isSecured !== undefined) {
    conditions.push(eq(binLocations.isSecured, isSecured));
  }

  // Execute query
  const availableBins = await query
    .where(and(...conditions))
    .orderBy(binLocations.zoneName, binLocations.binCode);

  return availableBins;
}

// Helper function to find the best available bin for a package
export async function findBestAvailableBin(
  warehouseId: string,
  packageRequirements: {
    isFragile?: boolean;
    isHighValue?: boolean;
    estimatedWeightKg?: number;
    preferredZone?: string;
  }
) {
  const { isFragile, isHighValue, estimatedWeightKg, preferredZone } = packageRequirements;

  // Define requirements based on package characteristics
  const filters: AvailableBinLocationFilters = {
    warehouseId,
    maxWeightKg: estimatedWeightKg,
  };

  // High-value packages should go to secured locations
  if (isHighValue) {
    filters.isSecured = true;
  }

  // Fragile packages might benefit from climate control
  if (isFragile) {
    filters.isClimateControlled = true;
  }

  // Try preferred zone first
  if (preferredZone) {
    filters.zoneName = preferredZone;
  }

  let availableBins = await getAvailableBinLocations(filters);

  // If no bins found with all requirements, try with relaxed constraints
  if (availableBins.length === 0 && (filters.isClimateControlled || filters.isSecured)) {
    // Remove climate control requirement first
    if (filters.isClimateControlled) {
      delete filters.isClimateControlled;
      availableBins = await getAvailableBinLocations(filters);
    }

    // If still no bins, remove security requirement (but keep for high-value items)
    if (availableBins.length === 0 && filters.isSecured && !isHighValue) {
      delete filters.isSecured;
      availableBins = await getAvailableBinLocations(filters);
    }
  }

  // If preferred zone has no space, try any zone
  if (availableBins.length === 0 && preferredZone) {
    delete filters.zoneName;
    availableBins = await getAvailableBinLocations(filters);
  }

  // Sort by preference (secured > climate controlled > most available capacity)
  const sortedBins = availableBins.sort((a, b) => {
    // Prioritize secured locations for valuable items
    if (isHighValue && a.isSecured !== b.isSecured) {
      return b.isSecured ? 1 : -1;
    }

    // Prioritize climate controlled for fragile items
    if (isFragile && a.isClimateControlled !== b.isClimateControlled) {
      return b.isClimateControlled ? 1 : -1;
    }

    // Prioritize bins with more available capacity
    return b.availableCapacity - a.availableCapacity;
  });

  return sortedBins[0] || null;
}