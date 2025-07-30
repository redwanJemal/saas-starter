// features/warehouses/components/warehouse-stats-cards.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useWarehouseStatistics } from '../hooks/use-warehouses-query';
import { Warehouse, Package, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function WarehouseStatsCards() {
  const { data: stats, isLoading, error } = useWarehouseStatistics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-gray-500">
              Failed to load statistics
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { aggregate } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Warehouses */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Warehouse className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Warehouses</p>
              <p className="text-2xl font-bold">{aggregate.totalWarehouses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Warehouses */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Warehouses</p>
              <p className="text-2xl font-bold">{aggregate.activeWarehouses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Capacity */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold">{aggregate.totalCapacity.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Utilization */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Utilization</p>
              <p className="text-2xl font-bold">{aggregate.averageUtilization}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}