// features/warehouses/db/queries/bins/get-bin-locations.query.ts
import { db } from '@/lib/db';
import { binLocations, warehouses, packageBinAssignments } from '@/features/warehouses/db/schema';
import { eq, and, desc, sql, ilike, isNull } from 'drizzle-orm';
import type { BinLocationFilters } from '@/features/warehouses/db/schema';

export async function getBinLocations(filters: BinLocationFilters = {}) {
  const { page = 1, limit = 10, warehouseId, zoneName, isActive, isAvailable, search } = filters;

  // Build where conditions
  const conditions = [];
  
  if (warehouseId) {
    conditions.push(eq(binLocations.warehouseId, warehouseId));
  }
  
  if (zoneName) {
    conditions.push(eq(binLocations.zoneName, zoneName));
  }
  
  if (isActive !== undefined) {
    conditions.push(eq(binLocations.isActive, isActive));
  }
  
  if (isAvailable !== undefined) {
    conditions.push(eq(binLocations.isAvailable, isAvailable));
  }
  
  if (search) {
    conditions.push(
      sql`(${binLocations.binCode} ILIKE ${`%${search}%`} OR ${binLocations.zoneName} ILIKE ${`%${search}%`} OR ${binLocations.description} ILIKE ${`%${search}%`})`
    );
  }

  // Create base query with package count
  const baseQuery = db
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
    })
    .from(binLocations)
    .innerJoin(warehouses, eq(binLocations.warehouseId, warehouses.id));

  // Apply conditions
  const finalQuery = conditions.length > 0 
    ? baseQuery.where(and(...conditions)) 
    : baseQuery;

  // Execute query with ordering
  const allBins = await finalQuery.orderBy(binLocations.zoneName, binLocations.binCode);

  // Calculate pagination
  const total = allBins.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedBins = allBins.slice(startIndex, endIndex);

  // Add calculated fields
  const binsWithCalcFields = paginatedBins.map(bin => ({
    ...bin,
    capacityUsagePercent: bin.maxCapacity && bin.maxCapacity > 0 
      ? Math.round((bin.currentPackageCount / bin.maxCapacity) * 100) 
      : 0,
    isAtCapacity: bin.maxCapacity && bin.maxCapacity > 0 
      ? bin.currentPackageCount >= bin.maxCapacity 
      : false,
  }));

  return {
    data: binsWithCalcFields,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}