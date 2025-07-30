// app/admin/warehouses/[id]/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWarehouse, useWarehouseCapacity } from '@/features/warehouses/hooks/use-warehouses-query';
import { BinLocationsTab } from '@/features/warehouses/components/bin-locations-tab';
import { WarehouseHeader } from '@/features/warehouses/components/warehouse-header';
import { WarehouseDetailStats } from '@/features/warehouses/components/warehouse-detail-stats';
import { WarehouseOverviewTab } from '@/features/warehouses/components/warehouse-overview-tab';
import { WarehousePackagesTab } from '@/features/warehouses/components/warehouse-packages-tab';
import { WarehouseActivityTab } from '@/features/warehouses/components/warehouse-activity-tab';
import { WarehouseSettingsTab } from '@/features/warehouses/components/warehouse-settings-tab';
import { Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface WarehouseDetailPageProps {
  params: {
    id: string;
  };
}

export default function WarehouseDetailPage({ params }: WarehouseDetailPageProps) {
  const router = useRouter();
  const { id: warehouseId } = params;
  
  // Data fetching
  const { data: warehouse, isLoading, error } = useWarehouse(warehouseId);
  const { data: capacityData } = useWarehouseCapacity(warehouseId);

  // Mock recent activity data (would come from API)
  const recentActivity = [
    {
      id: '1',
      description: 'Package PKG-001 assigned to bin A-12',
      timestamp: '2 hours ago',
      user: 'John Smith'
    },
    {
      id: '2',
      description: 'New shipment SHP-045 created',
      timestamp: '4 hours ago',
      user: 'Sarah Wilson'
    },
    {
      id: '3',
      description: 'Bin location B-15 marked as full',
      timestamp: '6 hours ago',
      user: 'System'
    }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !warehouse) {
    return (
      <div className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Warehouse not found</p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8">
      {/* Header */}
      <WarehouseHeader 
        warehouse={warehouse} 
        onBack={() => router.back()} 
      />

      {/* Stats Cards */}
      <div className="mb-6">
        <WarehouseDetailStats 
          warehouse={warehouse} 
          capacityData={capacityData} 
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bin-locations">Bin Locations</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <WarehouseOverviewTab warehouse={warehouse} />
        </TabsContent>

        <TabsContent value="bin-locations" className="space-y-4">
          <BinLocationsTab warehouseId={warehouseId} />
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <WarehousePackagesTab warehouseId={warehouseId} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <WarehouseActivityTab 
            warehouseId={warehouseId} 
            activities={recentActivity} 
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <WarehouseSettingsTab warehouse={warehouse} />
        </TabsContent>
      </Tabs>
    </div>
  );
}