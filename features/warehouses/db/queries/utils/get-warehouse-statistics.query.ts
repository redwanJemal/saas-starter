// features/warehouses/db/queries/utils/get-warehouse-statistics.query.ts
import { db } from '@/lib/db';
import { 
  warehouses, 
  binLocations, 
  packageBinAssignments, 
  storageCharges,
  customerWarehouseAssignments 
} from '@/features/warehouses/db/schema';
import { eq, and, sql, count, sum, isNull } from 'drizzle-orm';
import { packages } from '@/lib/db/schema';

export interface WarehouseStatistics {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  
  // Bin statistics
  totalBins: number;
  activeBins: number;
  availableBins: number;
  occupiedBins: number;
  binCapacityUtilization: number;
  
  // Package statistics
  totalPackages: number;
  activePackages: number;
  packagesInBins: number;
  packagesWithoutBins: number;
  
  // Customer statistics
  totalCustomerAssignments: number;
  activeCustomerAssignments: number;
  
  // Storage charges statistics
  totalStorageCharges: number;
  unbilledStorageCharges: number;
  totalStorageRevenue: string;
  unbilledStorageRevenue: string;
  
  // Capacity metrics
  totalBinCapacity: number;
  usedBinCapacity: number;
  availableBinCapacity: number;
  capacityUtilizationPercent: number;
}

export async function getWarehouseStatistics(warehouseId: string): Promise<WarehouseStatistics | null> {
  // Get warehouse basic info
  const [warehouse] = await db
    .select({
      id: warehouses.id,
      name: warehouses.name,
      code: warehouses.code,
    })
    .from(warehouses)
    .where(eq(warehouses.id, warehouseId))
    .limit(1);

  if (!warehouse) {
    return null;
  }

  // Get bin statistics
  const [binStats] = await db
    .select({
      totalBins: count(),
      activeBins: sql<number>`SUM(CASE WHEN ${binLocations.isActive} THEN 1 ELSE 0 END)`,
      availableBins: sql<number>`SUM(CASE WHEN ${binLocations.isActive} AND ${binLocations.isAvailable} THEN 1 ELSE 0 END)`,
      totalCapacity: sql<number>`COALESCE(SUM(${binLocations.maxCapacity}), 0)`,
    })
    .from(binLocations)
    .where(eq(binLocations.warehouseId, warehouseId));

  // Get occupied bins count
  const [occupiedBinsCount] = await db
    .select({
      occupiedBins: sql<number>`COUNT(DISTINCT ${packageBinAssignments.binId})`,
    })
    .from(packageBinAssignments)
    .innerJoin(binLocations, eq(packageBinAssignments.binId, binLocations.id))
    .where(and(
      eq(binLocations.warehouseId, warehouseId),
      isNull(packageBinAssignments.removedAt)
    ));

  // Get package statistics
  const [packageStats] = await db
    .select({
      totalPackages: count(),
      activePackages: sql<number>`SUM(CASE WHEN ${packages.status} NOT IN ('shipped', 'delivered', 'cancelled') THEN 1 ELSE 0 END)`,
    })
    .from(packages)
    .where(eq(packages.warehouseId, warehouseId));

  // Get packages in bins vs without bins
  const [packageBinStats] = await db
    .select({
      packagesInBins: sql<number>`COUNT(DISTINCT ${packageBinAssignments.packageId})`,
    })
    .from(packageBinAssignments)
    .innerJoin(packages, eq(packageBinAssignments.packageId, packages.id))
    .where(and(
      eq(packages.warehouseId, warehouseId),
      isNull(packageBinAssignments.removedAt),
      sql`${packages.status} NOT IN ('shipped', 'delivered', 'cancelled')`
    ));

  // Get used bin capacity
  const [usedCapacityResult] = await db
    .select({
      usedCapacity: sql<number>`COUNT(*)`,
    })
    .from(packageBinAssignments)
    .innerJoin(binLocations, eq(packageBinAssignments.binId, binLocations.id))
    .where(and(
      eq(binLocations.warehouseId, warehouseId),
      isNull(packageBinAssignments.removedAt)
    ));

  // Get customer assignment statistics
  const [customerStats] = await db
    .select({
      totalAssignments: count(),
      activeAssignments: sql<number>`SUM(CASE WHEN ${customerWarehouseAssignments.status} = 'active' THEN 1 ELSE 0 END)`,
    })
    .from(customerWarehouseAssignments)
    .where(eq(customerWarehouseAssignments.warehouseId, warehouseId));

  // Get storage charge statistics
  const [storageStats] = await db
    .select({
      totalCharges: count(),
      unbilledCharges: sql<number>`SUM(CASE WHEN NOT ${storageCharges.isInvoiced} THEN 1 ELSE 0 END)`,
      totalRevenue: sql<string>`COALESCE(SUM(CAST(${storageCharges.totalStorageFee} AS DECIMAL)), 0)`,
      unbilledRevenue: sql<string>`COALESCE(SUM(CASE WHEN NOT ${storageCharges.isInvoiced} THEN CAST(${storageCharges.totalStorageFee} AS DECIMAL) ELSE 0 END), 0)`,
    })
    .from(storageCharges)
    .innerJoin(packages, eq(storageCharges.packageId, packages.id))
    .where(eq(packages.warehouseId, warehouseId));

  // Calculate derived metrics
  const totalBinCapacity = binStats?.totalCapacity || 0;
  const usedBinCapacity = usedCapacityResult?.usedCapacity || 0;
  const availableBinCapacity = totalBinCapacity - usedBinCapacity;
  const capacityUtilizationPercent = totalBinCapacity > 0 
    ? Math.round((usedBinCapacity / totalBinCapacity) * 100) 
    : 0;

  const packagesInBins = packageBinStats?.packagesInBins || 0;
  const activePackages = packageStats?.activePackages || 0;
  const packagesWithoutBins = Math.max(0, activePackages - packagesInBins);

  const binCapacityUtilization = (binStats?.totalBins || 0) > 0 
    ? Math.round(((occupiedBinsCount?.occupiedBins || 0) / (binStats?.totalBins || 1)) * 100) 
    : 0;

  return {
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    warehouseCode: warehouse.code,
    
    // Bin statistics
    totalBins: binStats?.totalBins || 0,
    activeBins: binStats?.activeBins || 0,
    availableBins: binStats?.availableBins || 0,
    occupiedBins: occupiedBinsCount?.occupiedBins || 0,
    binCapacityUtilization,
    
    // Package statistics
    totalPackages: packageStats?.totalPackages || 0,
    activePackages: activePackages,
    packagesInBins,
    packagesWithoutBins,
    
    // Customer statistics
    totalCustomerAssignments: customerStats?.totalAssignments || 0,
    activeCustomerAssignments: customerStats?.activeAssignments || 0,
    
    // Storage charges statistics
    totalStorageCharges: storageStats?.totalCharges || 0,
    unbilledStorageCharges: storageStats?.unbilledCharges || 0,
    totalStorageRevenue: storageStats?.totalRevenue || '0.00',
    unbilledStorageRevenue: storageStats?.unbilledRevenue || '0.00',
    
    // Capacity metrics
    totalBinCapacity,
    usedBinCapacity,
    availableBinCapacity,
    capacityUtilizationPercent,
  };
}
