'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PackageTable } from '@/features/packages/components/package-table';
import { PackageFilters } from '@/features/packages/types/package.types';
import { useGlobalStore } from '@/shared/stores/global-store';
import { Plus, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PackagesPage() {
  const [filters, setFilters] = useState<PackageFilters>({});
  
  const selections = useGlobalStore(state => state.selections.packages || new Set());

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" />
            Package Management
          </h1>
          <p className="text-muted-foreground">
            Manage incoming packages and track their status
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              All time packages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Ready for shipment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Recently received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Packages</CardTitle>
          <CardDescription>
            View and manage all packages in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => handleStatusFilter('all')}>
                All
              </TabsTrigger>
              <TabsTrigger value="received" onClick={() => handleStatusFilter('received')}>
                Received
              </TabsTrigger>
              <TabsTrigger value="processing" onClick={() => handleStatusFilter('processing')}>
                Processing
              </TabsTrigger>
              <TabsTrigger value="ready_to_ship" onClick={() => handleStatusFilter('ready_to_ship')}>
                Ready to Ship
              </TabsTrigger>
              <TabsTrigger value="shipped" onClick={() => handleStatusFilter('shipped')}>
                Shipped
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <PackageTable
                filters={filters}
                variant="admin"
                onPackageClick={(pkg) => console.log('Package clicked:', pkg)}
              />
            </TabsContent>
            
            <TabsContent value="received" className="space-y-4">
              <PackageTable
                filters={filters}
                variant="admin"
                onPackageClick={(pkg) => console.log('Package clicked:', pkg)}
              />
            </TabsContent>
            
            <TabsContent value="processing" className="space-y-4">
              <PackageTable
                filters={filters}
                variant="admin"
                onPackageClick={(pkg) => console.log('Package clicked:', pkg)}
              />
            </TabsContent>
            
            <TabsContent value="ready_to_ship" className="space-y-4">
              <PackageTable
                filters={filters}
                variant="admin"
                onPackageClick={(pkg) => console.log('Package clicked:', pkg)}
              />
            </TabsContent>
            
            <TabsContent value="shipped" className="space-y-4">
              <PackageTable
                filters={filters}
                variant="admin"
                onPackageClick={(pkg) => console.log('Package clicked:', pkg)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
