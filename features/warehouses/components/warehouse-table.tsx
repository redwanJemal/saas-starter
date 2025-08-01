// features/warehouses/components/warehouse-table.tsx

'use client';

import { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Warehouse, WarehouseFilters } from '../types/warehouse.types';
import { useWarehouses } from '../hooks/use-warehouses-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, Building, Car, Package } from 'lucide-react';
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
import { useGlobalStore } from '@/shared/stores/global-store';

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

  // Global state
  const selections = useGlobalStore(state => state.selections.warehouses || new Set<string>());
  const setSelection = useGlobalStore(state => state.setSelection);
  const clearSelection = useGlobalStore(state => state.clearSelection);

  // Row selection
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Update global selection state when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    setSelection('warehouses', new Set(selectedIds));
  }, [rowSelection, setSelection]);

  // Table configuration
  const columns = useMemo<ColumnDef<Warehouse>[]>(() => [
    {
      id: 'select',
      header: ({ table }: { table: any }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={e => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={e => row.toggleSelected(!!e.target.checked)}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
      <Card>
        <CardHeader>
          <CardTitle>Warehouses ({warehouses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={warehouses}
            searchKey="name"
            searchPlaceholder="Search warehouses..."
            isLoading={isLoading}
            onRefresh={refetch}
            onRowClick={onWarehouseClick}
            pagination={response?.pagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}