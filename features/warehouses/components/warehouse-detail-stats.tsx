'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Warehouse } from '../types/warehouse.types';
import { Package, Clock, Truck, TrendingUp } from 'lucide-react';

interface WarehouseCapacityData {
  totalBinLocations: number;
  occupiedBinLocations: number;
  availableBinLocations: number;
}

interface WarehouseDetailStatsProps {
  warehouse: Warehouse;
  capacityData?: WarehouseCapacityData;
}

export function WarehouseDetailStats({ warehouse, capacityData }: WarehouseDetailStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Packages</p>
              <p className="text-2xl font-bold">{warehouse.stats?.totalPackages || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Packages</p>
              <p className="text-2xl font-bold">{warehouse.stats?.pendingPackages || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Shipments</p>
              <p className="text-2xl font-bold">{warehouse.stats?.activeShipments || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacity Used</p>
              <p className="text-2xl font-bold">
                {capacityData ? `${Math.round((capacityData.occupiedBinLocations / capacityData.totalBinLocations) * 100)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
