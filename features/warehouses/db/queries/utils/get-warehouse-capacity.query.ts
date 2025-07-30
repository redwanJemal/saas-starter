
// features/warehouses/db/queries/utils/get-warehouse-capacity.query.ts
import { db } from '@/lib/db';
import { 
  binLocations, 
  packageBinAssignments 
} from '@/features/warehouses/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';

export interface WarehouseCapacityInfo {
  warehouseId: string;
  zones: ZoneCapacityInfo[];
  totalCapacity: number;
  totalUsed: number;
  totalAvailable: number;
  utilizationPercent: number;
}

export interface ZoneCapacityInfo {
  zoneName: string;
  totalBins: number;
  activeBins: number;
  occupiedBins: number;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  utilizationPercent: number;
  bins: BinCapacityInfo[];
}

export interface BinCapacityInfo {
  binId: string;
  binCode: string;
  maxCapacity: number | null;
  currentPackages: number;
  availableCapacity: number | null;
  utilizationPercent: number;
  isAtCapacity: boolean;
  isActive: boolean;
  isAvailable: boolean;
}

export async function getWarehouseCapacity(warehouseId: string): Promise<WarehouseCapacityInfo | null> {
  // Get all bins with their current package counts
  const binsWithPackages = await db
    .select({
      binId: binLocations.id,
      binCode: binLocations.binCode,
      zoneName: binLocations.zoneName,
      maxCapacity: binLocations.maxCapacity,
      isActive: binLocations.isActive,
      isAvailable: binLocations.isAvailable,
      currentPackages: sql<number>`COALESCE(${sql`(
        SELECT COUNT(*)::int
        FROM ${packageBinAssignments}
        WHERE ${packageBinAssignments.binId} = ${binLocations.id}
        AND ${packageBinAssignments.removedAt} IS NULL
      )`}, 0)`,
    })
    .from(binLocations)
    .where(eq(binLocations.warehouseId, warehouseId))
    .orderBy(binLocations.zoneName, binLocations.binCode);

  if (binsWithPackages.length === 0) {
    return null;
  }

  // Group bins by zone
  const zoneMap = new Map<string, BinCapacityInfo[]>();
  
  binsWithPackages.forEach(bin => {
    const binInfo: BinCapacityInfo = {
      binId: bin.binId,
      binCode: bin.binCode,
      maxCapacity: bin.maxCapacity,
      currentPackages: bin.currentPackages,
      availableCapacity: bin.maxCapacity ? bin.maxCapacity - bin.currentPackages : null,
      utilizationPercent: bin.maxCapacity && bin.maxCapacity > 0 
        ? Math.round((bin.currentPackages / bin.maxCapacity) * 100) 
        : 0,
      isAtCapacity: bin.maxCapacity ? bin.currentPackages >= bin.maxCapacity : false,
      isActive: bin.isActive,
      isAvailable: bin.isAvailable,
    };

    if (!zoneMap.has(bin.zoneName)) {
      zoneMap.set(bin.zoneName, []);
    }
    zoneMap.get(bin.zoneName)!.push(binInfo);
  });

  // Calculate zone statistics
  const zones: ZoneCapacityInfo[] = Array.from(zoneMap.entries()).map(([zoneName, bins]) => {
    const totalBins = bins.length;
    const activeBins = bins.filter(bin => bin.isActive).length;
    const occupiedBins = bins.filter(bin => bin.currentPackages > 0).length;
    const totalCapacity = bins.reduce((sum, bin) => sum + (bin.maxCapacity || 0), 0);
    const usedCapacity = bins.reduce((sum, bin) => sum + bin.currentPackages, 0);
    const availableCapacity = totalCapacity - usedCapacity;
    const utilizationPercent = totalCapacity > 0 
      ? Math.round((usedCapacity / totalCapacity) * 100) 
      : 0;

    return {
      zoneName,
      totalBins,
      activeBins,
      occupiedBins,
      totalCapacity,
      usedCapacity,
      availableCapacity,
      utilizationPercent,
      bins,
    };
  });

  // Calculate warehouse totals
  const totalCapacity = zones.reduce((sum, zone) => sum + zone.totalCapacity, 0);
  const totalUsed = zones.reduce((sum, zone) => sum + zone.usedCapacity, 0);
  const totalAvailable = totalCapacity - totalUsed;
  const utilizationPercent = totalCapacity > 0 
    ? Math.round((totalUsed / totalCapacity) * 100) 
    : 0;

  return {
    warehouseId,
    zones,
    totalCapacity,
    totalUsed,
    totalAvailable,
    utilizationPercent,
  };
}