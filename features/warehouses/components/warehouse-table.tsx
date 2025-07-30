// features/warehouses/components/warehouse-table.tsx

'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Warehouse, WarehouseFilters } from '../types/warehouse.types';
import { useWarehouses } from '../hooks/use-warehouses-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Building, Package } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  WarehouseDetailsCell,
  WarehouseStatusCell,
  WarehouseContactCell,
  WarehousePackageStatsCell,
  WarehouseShipmentStatsCell,
  WarehousePricingCell,
  WarehouseCreatedCell,
  WarehouseActionsCell
} from './table-cells';

interface WarehouseTableProps {
  filters?: WarehouseFilters;
  onWarehouseClick?: (warehouse: Warehouse) => void;
}

export function WarehouseTable({ 
  filters = {}, 
  onWarehouseClick 
}: WarehouseTableProps) {
  // Data fetching
  const { data: response, isLoading, error, refetch } = useWarehouses(filters);
  const warehouses = response?.data || [];

  // Table configuration
  const columns = useMemo<ColumnDef<Warehouse>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Warehouse Details',
      cell: ({ row }) => <WarehouseDetailsCell warehouse={row.original} />,
    },
    {
      accessorKey: 'status',
      header: 'Status & Availability',
      cell: ({ row }) => <WarehouseStatusCell warehouse={row.original} />,
    },
    {
      accessorKey: 'contact',
      header: 'Contact Information',
      cell: ({ row }) => <WarehouseContactCell warehouse={row.original} />,
    },
    {
      accessorKey: 'packageStats',
      header: 'Package Statistics',
      cell: ({ row }) => <WarehousePackageStatsCell warehouse={row.original} />,
    },
    {
      accessorKey: 'shipmentStats',
      header: 'Shipment Activity',
      cell: ({ row }) => <WarehouseShipmentStatsCell warehouse={row.original} />,
    },
    {
      accessorKey: 'pricingSettings',
      header: 'Pricing & Limits',
      cell: ({ row }) => <WarehousePricingCell warehouse={row.original} />,
    },
    {
      accessorKey: 'metadata',
      header: 'Created',
      cell: ({ row }) => <WarehouseCreatedCell warehouse={row.original} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <WarehouseActionsCell 
          warehouse={row.original} 
          onViewDetails={onWarehouseClick} 
        />
      ),
    },
  ], [onWarehouseClick]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Warehouses</h3>
            <p className="text-gray-600 mb-4">
              We encountered an error while loading the warehouse data.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!isLoading && warehouses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Warehouses Found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.status || filters.countryCode
                ? "No warehouses match your current filters."
                : "Get started by adding your first warehouse."}
            </p>
            {!filters.search && !filters.status && !filters.countryCode && (
              <Link href="/admin/warehouses/create">
                <Button>
                  <Package className="mr-2 h-4 w-4" />
                  Add First Warehouse
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
        <div>
          Showing {warehouses.length} of {response?.pagination?.total || 0} warehouses
        </div>
        <div className="flex items-center gap-4">
          <span>
            Active: {warehouses.filter(w => w.status === 'active').length}
          </span>
          <span>
            Accepting: {warehouses.filter(w => w.acceptsNewPackages).length}
          </span>
          <span>
            Total Packages: {warehouses.reduce((sum, w) => sum + (w.stats?.totalPackages || 0), 0)}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
            columns={columns}
            data={warehouses}
            isLoading={isLoading}
            onRefresh={refetch}
            pagination={response?.pagination}
            searchPlaceholder="Search warehouses by name, code, or location..."
          />
    </div>
  );
}