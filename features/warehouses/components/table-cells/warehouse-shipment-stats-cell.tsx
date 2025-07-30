'use client';

import { Activity, Truck } from 'lucide-react';
import { Warehouse } from '../../types/warehouse.types';

interface WarehouseShipmentStatsCellProps {
  warehouse: Warehouse;
}

export function WarehouseShipmentStatsCell({ warehouse }: WarehouseShipmentStatsCellProps) {
  const stats = warehouse.stats;
  
  if (!stats) {
    return (
      <div className="text-xs text-gray-400 text-center py-2">
        No data
      </div>
    );
  }
  
  return (
    <div className="space-y-2 min-w-[120px]">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-green-600" />
        <span className="font-medium text-lg">{stats.totalShipments}</span>
        <span className="text-xs text-gray-500">total</span>
      </div>
      
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1 text-blue-600">
          <Activity className="h-3 w-3" />
          <span>{stats.activeShipments} active</span>
        </div>
        <div className="text-gray-500">
          {stats.totalShipments - stats.activeShipments} completed
        </div>
      </div>
    </div>
  );
}
