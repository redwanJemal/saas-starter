// features/warehouses/db/queries/bins/get-bin-location-by-id.query.ts
import { db } from '@/lib/db';
import { binLocations, warehouses, packageBinAssignments } from '@/features/warehouses/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function getBinLocationById(id: string) {
  const binResult = await db
    .select({
      id: binLocations.id,
      tenantId: binLocations.tenantId,
      warehouseId: binLocations.warehouseId,
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
      maxWeightKg: binLocations.maxWeightKg,
      dailyPremium: binLocations.dailyPremium,
      currency: binLocations.currency,
      isClimateControlled: binLocations.isClimateControlled,
      isSecured: binLocations.isSecured,
      isAccessible: binLocations.isAccessible,
      isActive: binLocations.isActive,
      isAvailable: binLocations.isAvailable,
      createdAt: binLocations.createdAt,
      updatedAt: binLocations.updatedAt,
      // Warehouse info
      warehouseCode: warehouses.code,
      warehouseName: warehouses.name,
      warehouseCity: warehouses.city,
      warehouseCountryCode: warehouses.countryCode,
    })
    .from(binLocations)
    .innerJoin(warehouses, eq(binLocations.warehouseId, warehouses.id))
    .where(eq(binLocations.id, id))
    .limit(1);

  if (binResult.length === 0) {
    return null;
  }

  const bin = binResult[0];
  
  // Add calculated fields
  return {
    ...bin,
    capacityUsagePercent: bin.maxCapacity && bin.maxCapacity > 0 
      ? Math.round((bin.currentPackageCount / bin.maxCapacity) * 100) 
      : 0,
    isAtCapacity: bin.maxCapacity && bin.maxCapacity > 0 
      ? bin.currentPackageCount >= bin.maxCapacity 
      : false,
  };
}
