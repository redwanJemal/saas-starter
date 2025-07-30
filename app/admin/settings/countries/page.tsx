// app/admin/settings/countries/page.tsx
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, Plus, Edit, MoreHorizontal, ArrowLeft, Flag, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useCountries } from '@/features/settings/hooks/use-settings-query';
import { Country, CountryFilters } from '@/features/settings/types/settings.types';
import { DataTable } from '@/shared/components/data-table/data-table';

export default function CountriesPage() {
  const [filters, setFilters] = useState<CountryFilters>({
    page: 1,
    limit: 20,
  });

  const { data: response, isLoading, refetch } = useCountries(filters);
  const countries = response?.data || [];

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

  const columns: ColumnDef<Country>[] = [
    {
      accessorKey: 'flagEmoji',
      header: '',
      cell: ({ row }) => (
        <div className="text-lg">
          {row.original.flagEmoji || '🏳️'}
        </div>
      ),
      size: 50,
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="font-mono font-semibold">
          {row.original.code}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: 'name',
      header: 'Country Name',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'region',
      header: 'Region',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.region}
          {row.original.subregion && (
            <div className="text-xs text-gray-500">
              {row.original.subregion}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'phonePrefix',
      header: 'Phone Prefix',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.phonePrefix && `+${row.original.phonePrefix}`}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'isShippingEnabled',
      header: 'Shipping',
      cell: ({ row }) => (
        <Badge variant={row.original.isShippingEnabled ? 'default' : 'secondary'}>
          {row.original.isShippingEnabled ? 'Enabled' : 'Disabled'}
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
              <Link href={`/admin/settings/countries/${row.original.id}/edit`}>
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

  if (!countries.length && !isLoading) {
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
                <Globe className="h-6 w-6" />
                Countries
              </h1>
              <p className="text-gray-600">
                Manage supported countries and shipping destinations
              </p>
            </div>
          </div>
          <Link href="/admin/settings/countries/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Country
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No countries configured
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Get started by adding your first supported country
            </p>
            <Link href="/admin/settings/countries/create">
              <Button>
                <Flag className="mr-2 h-4 w-4" />
                Add First Country
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
              <Globe className="h-6 w-6" />
              Countries
            </h1>
            <p className="text-gray-600">
              Manage supported countries and shipping destinations
            </p>
          </div>
        </div>
        <Link href="/admin/settings/countries/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Country
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
                <SelectItem value="all">All Countries</SelectItem>
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
          Showing {countries.length} of {response?.pagination?.total || 0} countries
        </div>
        <div className="flex items-center gap-4">
          <span>
            Active: {countries.filter(c => c.isActive).length}
          </span>
          <span>
            Shipping Enabled: {countries.filter(c => c.isShippingEnabled).length}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={countries}
            isLoading={isLoading}
            onRefresh={refetch}
            pagination={response?.pagination}
            searchPlaceholder="Search countries by name or code..."
          />
        </CardContent>
      </Card>
    </div>
  );
}