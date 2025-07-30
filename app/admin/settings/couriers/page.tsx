// app/admin/settings/couriers/page.tsx
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Truck, Plus, Edit, MoreHorizontal, ArrowLeft, Package, ExternalLink, Globe } from 'lucide-react';
import Link from 'next/link';
import { useCouriers } from '@/features/settings/hooks/use-settings-query';
import { Courier, CourierFilters } from '@/features/settings/types/settings.types';
import { DataTable } from '@/shared/components/data-table/data-table';

export default function CouriersPage() {
  const [filters, setFilters] = useState<CourierFilters>({
    page: 1,
    limit: 20,
  });

  const { data: response, isLoading, refetch } = useCouriers(filters);
  const couriers = response?.data || [];

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search: search || undefined, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      isActive: value === 'all' ? undefined : value === 'true',
      page: 1,
    }));
  };

  const columns: ColumnDef<Courier>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="font-mono font-semibold">
          {row.original.code}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'name',
      header: 'Courier Name',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }) => (
        row.original.website ? (
          <a
            href={row.original.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <Globe className="h-3 w-3" />
            Website
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-gray-400 text-sm">No website</span>
        )
      ),
      size: 120,
    },
    {
      accessorKey: 'trackingUrlTemplate',
      header: 'Tracking',
      cell: ({ row }) => (
        <Badge variant={row.original.trackingUrlTemplate ? 'default' : 'secondary'}>
          {row.original.trackingUrlTemplate ? 'Available' : 'None'}
        </Badge>
      ),
      size: 100,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      size: 100,
    },
    {
      id: 'integration',
      header: 'Integration',
      cell: ({ row }) => {
        const hasCredentials = row.original.apiCredentials && Object.keys(row.original.apiCredentials).length > 0;
        const hasSettings = row.original.integrationSettings && Object.keys(row.original.integrationSettings).length > 0;
        
        if (hasCredentials || hasSettings) {
          return (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Configured
            </Badge>
          );
        }
        
        return (
          <Badge variant="outline">
            Not Configured
          </Badge>
        );
      },
      size: 120,
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
            <DropdownMenuItem asChild>
              <Link href={`/admin/settings/couriers/${row.original.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 50,
    },
  ];

  if (!couriers.length && !isLoading) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="h-6 w-6" />
                Couriers
              </h1>
              <p className="text-gray-600">
                Set up courier services and shipping integrations
              </p>
            </div>
          </div>
          <Link href="/admin/settings/couriers/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Courier
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No couriers configured
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Get started by adding your first courier service
            </p>
            <Link href="/admin/settings/couriers/create">
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Add First Courier
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-6 w-6" />
              Couriers
            </h1>
            <p className="text-gray-600">
              Set up courier services and shipping integrations
            </p>
          </div>
        </div>
        <Link href="/admin/settings/couriers/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Courier
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={filters.isActive === undefined ? 'all' : filters.isActive ? 'true' : 'false'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Couriers</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
        <div>
          Showing {couriers.length} of {response?.pagination?.total || 0} couriers
        </div>
        <div className="flex items-center gap-4">
          <span>
            Active: {couriers.filter(c => c.isActive).length}
          </span>
          <span>
            With Tracking: {couriers.filter(c => c.trackingUrlTemplate).length}
          </span>
          <span>
            Integrated: {couriers.filter(c => c.apiCredentials && Object.keys(c.apiCredentials).length > 0).length}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={couriers}
            isLoading={isLoading}
            onRefresh={refetch}
            pagination={response?.pagination}
            searchPlaceholder="Search couriers by name or code..."
          />
        </CardContent>
      </Card>
    </div>
  );
}