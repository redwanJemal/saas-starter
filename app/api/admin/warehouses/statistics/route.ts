import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { getWarehouses, getWarehouseStatistics } from '@/features/warehouses/db/queries';

// GET /api/admin/warehouses/statistics - Get statistics for all warehouses
export async function GET(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('warehouses.read');
    
    const { searchParams } = new URL(request.url);
    const warehouseIds = searchParams.get('warehouseIds')?.split(',');
    
    let warehousesToProcess: string[] = [];
    
    if (warehouseIds && warehouseIds.length > 0) {
      // Use specified warehouse IDs
      warehousesToProcess = warehouseIds;
    } else {
      // Get all active warehouses for tenant
      const warehousesResult = await getWarehouses({
        status: 'active',
        limit: 100
      });
      warehousesToProcess = warehousesResult.data.map(w => w.id);
    }

    // Get statistics for each warehouse
    const statisticsPromises = warehousesToProcess.map(warehouseId =>
      getWarehouseStatistics(warehouseId)
    );
    
    const allStatistics = await Promise.all(statisticsPromises);
    
    // Filter out null results (warehouses that don't exist)
    const validStatistics = allStatistics.filter(stats => stats !== null);

    // Calculate aggregate statistics
    const aggregateStats = {
      totalWarehouses: validStatistics.length,
      totalBins: validStatistics.reduce((sum, stats) => sum + stats!.totalBins, 0),
      totalPackages: validStatistics.reduce((sum, stats) => sum + stats!.totalPackages, 0),
      totalActivePackages: validStatistics.reduce((sum, stats) => sum + stats!.activePackages, 0),
      totalCustomerAssignments: validStatistics.reduce((sum, stats) => sum + stats!.totalCustomerAssignments, 0),
      totalStorageCharges: validStatistics.reduce((sum, stats) => sum + stats!.totalStorageCharges, 0),
      totalStorageRevenue: validStatistics.reduce((sum, stats) => sum + parseFloat(stats!.totalStorageRevenue), 0).toFixed(2),
      totalUnbilledStorageRevenue: validStatistics.reduce((sum, stats) => sum + parseFloat(stats!.unbilledStorageRevenue), 0).toFixed(2),
      averageCapacityUtilization: validStatistics.length > 0 
        ? Math.round(validStatistics.reduce((sum, stats) => sum + stats!.capacityUtilizationPercent, 0) / validStatistics.length)
        : 0,
    };

    return NextResponse.json({
      warehouses: validStatistics,
      aggregate: aggregateStats,
    });
  } catch (error) {
    console.error('Error fetching warehouse statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse statistics' },
      { status: 500 }
    );
  }
}
