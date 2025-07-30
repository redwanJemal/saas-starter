// app/admin/warehouses/page.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Warehouse, Plus, Search, Filter, Download } from 'lucide-react';
import Link from 'next/link';
import { WarehouseTable } from '@/features/warehouses/components/warehouse-table';
import { WarehouseStatsCards } from '@/features/warehouses/components/warehouse-stats-cards';
import { WarehouseFilters } from '@/features/warehouses/types/warehouse.types';

export default function AdminWarehousesPage() {
  // Filter state
  const [filters, setFilters] = useState<WarehouseFilters>({
    page: 1,
    limit: 20,
  });

  // Update filter handlers
  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search: search || undefined, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === 'all' ? undefined : status as any,
      page: 1 
    }));
  };

  const handleAcceptsPackagesChange = (acceptsPackages: string) => {
    setFilters(prev => ({
      ...prev,
      acceptsNewPackages: acceptsPackages === 'all' ? undefined : acceptsPackages === 'true',
      page: 1
    }));
  };

  const handleCountryChange = (countryCode: string) => {
    setFilters(prev => ({
      ...prev,
      countryCode: countryCode === 'all' ? undefined : countryCode,
      page: 1
    }));
  };

  return (
    <div className="flex-1 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="h-6 w-6" />
            Warehouses
          </h1>
          <p className="text-gray-600">Manage warehouse operations and settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/admin/warehouses/create">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <WarehouseStatsCards />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search warehouses..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.acceptsNewPackages === undefined ? 'all' : filters.acceptsNewPackages ? 'true' : 'false'}
          onValueChange={handleAcceptsPackagesChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Package Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Accepting Packages</SelectItem>
            <SelectItem value="false">Not Accepting</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.countryCode || 'all'}
          onValueChange={handleCountryChange}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="UK">United Kingdom</SelectItem>
            <SelectItem value="CA">Canada</SelectItem>
            <SelectItem value="AU">Australia</SelectItem>
            <SelectItem value="DE">Germany</SelectItem>
            <SelectItem value="FR">France</SelectItem>
            <SelectItem value="JP">Japan</SelectItem>
            <SelectItem value="SG">Singapore</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Warehouse Table */}
      <WarehouseTable
        filters={filters}
        onWarehouseClick={(warehouse) => {
          // Handle warehouse click - could open modal or navigate
          console.log('Warehouse clicked:', warehouse);
        }}
      />
    </div>
  );
}