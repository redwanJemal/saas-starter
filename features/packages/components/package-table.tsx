'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Package, PackageFilters } from '../types/package.types';
import { usePackages, useBulkUpdatePackageStatus } from '../hooks/use-packages-query';
import { useGlobalStore } from '@/shared/stores/global-store';
import { PackageStatusBadge } from './package-status-badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PackageTableProps {
  filters?: PackageFilters;
  variant?: 'admin' | 'customer';
  onPackageClick?: (packageItem: Package) => void;
}

export function PackageTable({
  filters = {},
  variant = 'customer',
  onPackageClick,
}: PackageTableProps) {
  // Data fetching
  const { data: response, isLoading, error, refetch } = usePackages(filters);
  const packages = response?.data || [];
  const pagination = response?.pagination;

  // Global state
  const selections = useGlobalStore(state => state.selections.packages || new Set<string>());
  const setSelection = useGlobalStore(state => state.setSelection);
  const clearSelection = useGlobalStore(state => state.clearSelection);

  // Mutations
  const bulkUpdateStatus = useBulkUpdatePackageStatus();

  // Table configuration
  const columns = useMemo<ColumnDef<Package>[]>(() => [
    ...(variant === 'admin' ? [{
      id: 'select',
      header: ({ table }: { table: any }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => {
            const allIds = new Set(packages.map((pkg: Package) => pkg.id));
            setSelection('packages', e.target.checked ? allIds : new Set());
          }}
        />
      ),
      cell: ({ row }: { row: any }) => (
        <input
          type="checkbox"
          checked={selections.has(row.original.id)}
          onChange={(e) => {
            const newSelection = new Set(selections);
            if (e.target.checked) {
              newSelection.add(row.original.id);
            } else {
              newSelection.delete(row.original.id);
            }
            setSelection('packages', newSelection);
          }}
        />
      ),
    }] : []),
    {
      accessorKey: 'trackingNumber',
      header: 'Tracking Number',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">{row.original.trackingNumber}</span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }: { row: any }) => (
        <span>{row.original.customerName}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <PackageStatusBadge status={row.original.status} />
      ),
    },
    {
      accessorKey: 'receivedAt',
      header: 'Received',
      cell: ({ row }: { row: any }) => {
        if (!row.original.receivedAt) return '-';
        return new Date(row.original.receivedAt).toLocaleDateString();
      },
    },
    {
      accessorKey: 'weight',
      header: 'Weight',
      cell: ({ row }: { row: any }) => {
        if (!row.original.weight) return '-';
        return `${row.original.weight}kg`;
      },
    },
    ...(variant === 'admin' ? [{
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPackageClick?.(row.original)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Package</DropdownMenuItem>
            <DropdownMenuItem>Update Status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }] : []),
  ], [variant, packages, selections, setSelection, onPackageClick]);

  // Bulk actions
  const handleBulkStatusUpdate = (status: string) => {
    const selectedIds = Array.from(selections);
    if (selectedIds.length === 0) return;

    bulkUpdateStatus.mutate({ ids: selectedIds, status });
  };

  const bulkActions = variant === 'admin' && selections.size > 0 ? (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleBulkStatusUpdate('processing')}
        disabled={bulkUpdateStatus.isPending}
      >
        Mark as Processing ({selections.size})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleBulkStatusUpdate('ready_to_ship')}
        disabled={bulkUpdateStatus.isPending}
      >
        Mark Ready to Ship ({selections.size})
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => clearSelection('packages')}
      >
        Clear Selection
      </Button>
    </div>
  ) : null;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load packages</p>
        <Button onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <DataTable
      data={packages}
      columns={columns}
      isLoading={isLoading}
      searchKey="trackingNumber"
      searchPlaceholder="Search by tracking number..."
      onRefresh={refetch}
      actions={bulkActions}
      onRowClick={onPackageClick}
    />
  );
}
