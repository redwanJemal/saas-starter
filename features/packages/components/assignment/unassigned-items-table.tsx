// features/packages/components/assignment/unassigned-items-table.tsx
'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Package, Calendar, Truck } from 'lucide-react';
import { IncomingShipmentItem } from '@/features/packages/types/package.types';
import { formatDistanceToNow } from 'date-fns';

interface UnassignedItemsTableProps {
  items: IncomingShipmentItem[];
  selectedItems: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

export function UnassignedItemsTable({ 
  items, 
  selectedItems, 
  onSelectionChange 
}: UnassignedItemsTableProps) {
  const columns = useMemo<ColumnDef<IncomingShipmentItem>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            if (value) {
              const allIds = new Set([...selectedItems, ...items.map(item => item.id)]);
              onSelectionChange(allIds);
            } else {
              const currentPageIds = new Set(items.map(item => item.id));  
              const newSelection = new Set([...selectedItems].filter(id => !currentPageIds.has(id)));
              onSelectionChange(newSelection);
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedItems.has(row.original.id)}
          onCheckedChange={(value) => {
            const newSelection = new Set(selectedItems);
            if (value) {
              newSelection.add(row.original.id);
            } else {
              newSelection.delete(row.original.id);
            }
            onSelectionChange(newSelection);
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'trackingNumber',
      header: 'Tracking Number',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.trackingNumber}</div>
      ),
    },
    {
      accessorKey: 'courierInfo',
      header: 'Courier',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">{row.original.courierName}</div>
            <div className="text-xs text-gray-500">{row.original.courierName}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'batchInfo',
      header: 'Batch',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.incomingShipmentId?.substring(0, 8) || 'N/A'}</div>
          {row.original.createdAt && (
            <div className="text-gray-500">
              {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'warehouseInfo',
      header: 'Warehouse',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.warehouseId}</div>
          <div className="text-gray-500">{row.original.warehouseId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'scannedAt',
      header: 'Scanned',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{new Date(row.original.scannedAt || Date.now()).toLocaleDateString()}</div>
          <div className="text-gray-500">
            {formatDistanceToNow(new Date(row.original.scannedAt || Date.now()), { addSuffix: true })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'assignmentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.assignmentStatus;
        const statusConfig = {
          unassigned: { label: 'Unassigned', variant: 'secondary' as const },
          assigned: { label: 'Assigned', variant: 'default' as const },
          received: { label: 'Received', variant: 'default' as const },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unassigned;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ], [items, selectedItems, onSelectionChange]);

  return (
    <DataTable
      columns={columns}
      data={items}
      searchKey="trackingNumber"
      searchPlaceholder="Search by tracking number..."
    />
  );
}