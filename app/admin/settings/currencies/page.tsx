// app/admin/settings/currencies/page.tsx
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DollarSign, Plus, Edit, MoreHorizontal, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useCurrencies } from '@/features/settings/hooks/use-settings-query';
import { Currency, CurrencyFilters } from '@/features/settings/types/settings.types';
import { DataTable } from '@/shared/components/data-table/data-table';

export default function CurrenciesPage() {
  const [filters, setFilters] = useState<CurrencyFilters>({
    page: 1,
    limit: 20,
  });

  const { data: response, isLoading, refetch } = useCurrencies(filters);
  const currencies = response?.data || [];

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

  const columns: ColumnDef<Currency>[] = [
    {
      accessorKey: 'symbol',
      header: 'Symbol',
      cell: ({ row }) => (
        <div className="text-lg font-bold text-center w-8">
          {row.original.symbol}
        </div>
      ),
      size: 60,
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
      header: 'Currency Name',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'decimalPlaces',
      header: 'Decimal Places',
      cell: ({ row }) => (
        <div className="text-center font-mono">
          {row.original.decimalPlaces}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'symbolPosition',
      header: 'Symbol Position',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.symbolPosition === 'before' ? 'Before' : 'After'}
        </Badge>
      ),
      size: 130,
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
      id: 'preview',
      header: 'Preview',
      cell: ({ row }) => {
        const currency = row.original;
        const sampleAmount = 1234.56;
        const formatted = currency.symbolPosition === 'before' 
          ? `${currency.symbol}${sampleAmount.toFixed(currency.decimalPlaces || 2)}`
          : `${sampleAmount.toFixed(currency.decimalPlaces || 2)}${currency.symbol}`;
        
        return (
          <div className="font-mono text-sm text-gray-600">
            {formatted}
          </div>
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
              <Link href={`/admin/settings/currencies/${row.original.id}/edit`}>
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

  if (!currencies.length && !isLoading) {
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
                <DollarSign className="h-6 w-6" />
                Currencies
              </h1>
              <p className="text-gray-600">
                Configure supported currencies and exchange rates
              </p>
            </div>
          </div>
          <Link href="/admin/settings/currencies/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Currency
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No currencies configured
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Get started by adding your first supported currency
            </p>
            <Link href="/admin/settings/currencies/create">
              <Button>
                <CreditCard className="mr-2 h-4 w-4" />
                Add First Currency
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
              <DollarSign className="h-6 w-6" />
              Currencies
            </h1>
            <p className="text-gray-600">
              Configure supported currencies and exchange rates
            </p>
          </div>
        </div>
        <Link href="/admin/settings/currencies/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Currency
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
                <SelectItem value="all">All Currencies</SelectItem>
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
          Showing {currencies.length} of {response?.pagination?.total || 0} currencies
        </div>
        <div className="flex items-center gap-4">
          <span>
            Active: {currencies.filter(c => c.isActive).length}
          </span>
          <span>
            Major Currencies: {currencies.filter(c => ['USD', 'EUR', 'GBP', 'JPY', 'AED'].includes(c.code)).length}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={currencies}
            isLoading={isLoading}
            onRefresh={refetch}
            pagination={response?.pagination}
            searchPlaceholder="Search currencies by name or code..."
          />
        </CardContent>
      </Card>
    </div>
  );
}