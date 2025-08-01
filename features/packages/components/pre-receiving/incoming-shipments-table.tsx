// features/packages/components/pre-receiving/incoming-shipments-table.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/shared/components/data-table/data-table';
import { useGlobalStore } from '@/shared/stores/global-store';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Edit, MoreHorizontal, Package, Truck } from 'lucide-react';
import { IncomingShipmentWithItems } from '@/features/packages/types/package.types';
import { formatDistanceToNow } from 'date-fns';

interface IncomingShipmentsTableProps {
  shipments: IncomingShipmentWithItems[];
  onViewShipment?: (shipment: IncomingShipmentWithItems) => void;
  onEditShipment?: (shipment: IncomingShipmentWithItems) => void;
}

export function IncomingShipmentsTable({ 
  shipments, 
  onViewShipment, 
  onEditShipment 
}: IncomingShipmentsTableProps) {
  // Global state for selections
  const selections = useGlobalStore(state => state.selections.incomingShipments || new Set<string>());
  const setSelection = useGlobalStore(state => state.setSelection);
  const clearSelection = useGlobalStore(state => state.clearSelection);

  // Row selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Update global selection state when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    setSelection('incomingShipments', new Set(selectedIds));
  }, [rowSelection, setSelection]);

  const columns = useMemo<ColumnDef<IncomingShipmentWithItems>[]>(
    () => [
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
        accessorKey: 'batchReference',
        header: 'Batch Reference',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.batchReference}</div>
        ),
      },
      {
        accessorKey: 'courierName',
        header: 'Courier',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-400" />
            {row.original.courierName}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const statusConfig = {
            pending: { label: 'Pending', variant: 'secondary' as const },
            scanning: { label: 'Scanning', variant: 'outline' as const },
            scanned: { label: 'Scanned', variant: 'default' as const },
            assigned: { label: 'Assigned', variant: 'default' as const },
            received: { label: 'Received', variant: 'default' as const },
            expected: { label: 'Expected', variant: 'secondary' as const },
          };
          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'itemCounts',
        header: 'Items',
        cell: ({ row }) => {
          const shipment = row.original;
          const totalItems = shipment.items?.length || 0;
          const assignedItems = shipment.items?.filter(item => item.assignmentStatus === 'assigned').length || 0;
          const unassignedItems = totalItems - assignedItems;

          return (
            <div className="text-sm">
              <div className="font-medium">{totalItems} total</div>
              <div className="text-gray-500">
                {assignedItems} assigned, {unassignedItems} unassigned
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'arrivalDate',
        header: 'Arrival Date',
        cell: ({ row }) => {
          const date = row.original.arrivalDate;
          return date ? (
            <div className="text-sm">
              <div>{new Date(date).toLocaleDateString()}</div>
              <div className="text-gray-500">
                {formatDistanceToNow(new Date(date), { addSuffix: true })}
              </div>
            </div>
          ) : null;
        },
      },
      {
        accessorKey: 'warehouseName',
        header: 'Warehouse',
        cell: ({ row }) => (
          <div className="text-sm">{row.original.warehouse?.name}</div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewShipment?.(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditShipment?.(row.original)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Shipment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ], [onViewShipment, onEditShipment]);

  return (
    <DataTable
      columns={columns}
      data={shipments}
      searchKey="batchReference"
      searchPlaceholder="Search shipments..."
      onRowClick={onViewShipment}
    />
  );
}