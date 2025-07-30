// features/warehouses/db/queries/bins/get-available-bin-locations.query.ts
import { db } from '@/lib/db';
import { binLocations, packageBinAssignments } from '@/features/warehouses/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';

export async function getAvailableBinLocations(warehouseId: string) {
  const availableBins = await db
    .select({
      id: binLocations.id,
      binCode: binLocations.binCode,
      zoneName: binLocations.zoneName,
      description: binLocations.description,
      maxCapacity: binLocations.maxCapacity,
      currentPackageCount: sql<number>`COALESCE(${sql`(
        SELECT COUNT(*)::int
        FROM ${packageBinAssignments}
        WHERE ${packageBinAssignments.binId} = ${binLocations.id}
        AND ${packageBinAssignments.removedAt} IS NULL
      )`}, 0)`,
      dailyPremium: binLocations.dailyPremium,
      isClimateControlled: binLocations.isClimateControlled,
      isSecured: binLocations.isSecured,
      isAccessible: binLocations.isAccessible,
    })
    .from(binLocations)
    .where(and(
      eq(binLocations.warehouseId, warehouseId),
      eq(binLocations.isActive, true),
      eq(binLocations.isAvailable, true)
    ))
    .orderBy(binLocations.zoneName, binLocations.binCode);

  // Filter out bins at capacity and add calculated fields
  return availableBins
    .filter(bin => !bin.maxCapacity || bin.currentPackageCount < bin.maxCapacity)
    .map(bin => ({
      ...bin,
      capacityUsagePercent: bin.maxCapacity && bin.maxCapacity > 0 
        ? Math.round((bin.currentPackageCount / bin.maxCapacity) * 100) 
        : 0,
      availableCapacity: bin.maxCapacity ? bin.maxCapacity - bin.currentPackageCount : null,
    }));
}