'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Customer, CustomerFilters } from '../types/customer.types';
import { useCustomers } from '../hooks/use-customers-query';
import { CustomerStatusBadge } from './customer-status-badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CustomerTableProps {
  filters?: CustomerFilters;
  onCustomerClick?: (customer: Customer) => void;
}

export function CustomerTable({
  filters = {},
  onCustomerClick,
}: CustomerTableProps) {
  // Data fetching
  const { data: response, isLoading, error, refetch } = useCustomers(filters);
  const customers = response?.data || [];

  // Table configuration
  const columns = useMemo<ColumnDef<Customer>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">
            {row.original.name}
          </span>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Location',
      cell: ({ row }) => (
        <div>
          <span>{row.original.city}, {row.original.state}</span>
          <div className="text-sm text-muted-foreground">
            {row.original.country}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <CustomerStatusBadge status={row.original.status} />
      ),
    },
    {
      accessorKey: 'packageCount',
      header: 'Packages',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.packageCount}</span>
      ),
    },
    // Removed totalSpent column as it's not in our schema
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => {
        return new Date(row.original.createdAt).toLocaleDateString();
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCustomerClick?.(row.original)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Customer</DropdownMenuItem>
            <DropdownMenuItem>View Packages</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [onCustomerClick]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load customers</p>
        <Button onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <DataTable
      data={customers}
      columns={columns}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="Search customers..."
      onRefresh={refetch}
      onRowClick={onCustomerClick}
    />
  );
}
