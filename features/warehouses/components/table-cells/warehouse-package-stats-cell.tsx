'use client';

import { Activity, Clock, Package } from 'lucide-react';
import { Warehouse } from '../../types/warehouse.types';

interface WarehousePackageStatsCellProps {
  warehouse: Warehouse;
}

export function WarehousePackageStatsCell({ warehouse }: WarehousePackageStatsCellProps) {
  const stats = warehouse.stats;
  
  const getPackageStatusColor = (pending: number, ready: number) => {
    if (pending > ready * 2) return 'text-red-600';
    if (pending > ready) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!stats) {
    return (
      <div className="text-xs text-gray-400 text-center py-2">
        No statistics available
      </div>
    );
  }
  
  return (
    <div className="space-y-2 min-w-[140px]">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-lg">{stats.totalPackages}</span>
        <span className="text-xs text-gray-500">total</span>
      </div>
      
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className={`flex items-center gap-1 ${getPackageStatusColor(stats.pendingPackages, stats.readyPackages)}`}>
          <Clock className="h-3 w-3" />
          <span>{stats.pendingPackages} pending</span>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <Activity className="h-3 w-3" />
          <span>{stats.readyPackages} ready</span>
        </div>
      </div>

      {stats.totalPackages > 0 && (
        <div className="text-xs text-gray-500">
          {Math.round((stats.readyPackages / stats.totalPackages) * 100)}% ready rate
        </div>
      )}
    </div>
  );
}
