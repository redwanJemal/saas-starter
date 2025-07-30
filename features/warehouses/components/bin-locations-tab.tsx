// features/warehouses/components/bin-locations-tab.tsx

'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-table/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBinLocations, useCreateBinLocation, useUpdateBinLocation, useDeleteBinLocation } from '../hooks/use-warehouses-query';
import { BinLocation, BinLocationFilters } from '../types/warehouse.types';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  MapPin, 
  Package, 
  Shield, 
  ThermometerSun,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface BinLocationsTabProps {
  warehouseId: string;
}

export function BinLocationsTab({ warehouseId }: BinLocationsTabProps) {
  // Filter state
  const [filters, setFilters] = useState<BinLocationFilters>({
    warehouseId,
    page: 1,
    limit: 20,
  });

  // Data fetching
  const { data: response, isLoading, error, refetch } = useBinLocations(filters);
  const binLocations = response?.data || [];

  // Mutations
  const createBinLocation = useCreateBinLocation();
  const updateBinLocation = useUpdateBinLocation();
  const deleteBinLocation = useDeleteBinLocation();

  // Filter handlers
  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search: search || undefined, page: 1 }));
  };

  const handleZoneChange = (zoneName: string) => {
    setFilters(prev => ({ 
      ...prev, 
      zoneName: zoneName === 'all' ? undefined : zoneName,
      page: 1 
    }));
  };

  const handleStatusChange = (isActive: string) => {
    setFilters(prev => ({
      ...prev,
      isActive: isActive === 'all' ? undefined : isActive === 'true',
      page: 1
    }));
  };

  const handleAvailabilityChange = (isAvailable: string) => {
    setFilters(prev => ({
      ...prev,
      isAvailable: isAvailable === 'all' ? undefined : isAvailable === 'true',
      page: 1
    }));
  };

  // Utility functions
  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(num);
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCapacityPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  // Get summary stats
  const stats = useMemo(() => {
    const total = binLocations.length;
    const active = binLocations.filter(bin => bin.isActive).length;
    const full = binLocations.filter(bin => bin.currentCapacity >= bin.maxCapacity).length;
    const nearFull = binLocations.filter(bin => {
      const percentage = (bin.currentCapacity / bin.maxCapacity) * 100;
      return percentage >= 70 && percentage < 100;
    }).length;
    
    return { total, active, full, nearFull };
  }, [binLocations]);

  // Table columns
  const columns = useMemo<ColumnDef<BinLocation>[]>(() => [
    {
      accessorKey: 'binCode',
      header: 'Bin Location',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.binCode}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Zone: {row.original.zoneName}
          </div>
          {row.original.description && (
            <div className="text-xs text-gray-400 mt-1">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => {
        const { currentCapacity, maxCapacity } = row.original;
        const percentage = getCapacityPercentage(currentCapacity, maxCapacity);
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              <span className={`font-medium ${getCapacityColor(currentCapacity, maxCapacity)}`}>
                {currentCapacity}/{maxCapacity}
              </span>
            </div>
            <Progress 
              value={percentage} 
              className="h-2"
            />
            <div className="text-xs text-gray-500">
              {percentage}% utilized
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'features',
      header: 'Features',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.isClimateControlled && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              <ThermometerSun className="h-3 w-3 mr-1" />
              Climate
            </Badge>
          )}
          {row.original.isSecured && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              <Shield className="h-3 w-3 mr-1" />
              Secured
            </Badge>
          )}
          {row.original.isAccessible && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
              Accessible
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'pricing',
      header: 'Daily Premium',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">
            {formatCurrency(row.original.dailyPremium, row.original.currency)}
          </span>
          <div className="text-xs text-gray-500">per day</div>
        </div>
      ),
    },
    {
      accessorKey: 'weight',
      header: 'Max Weight',
      cell: ({ row }) => (
        <span className="font-medium">
          {parseFloat(row.original.maxWeightKg).toFixed(1)} kg
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const { currentCapacity, maxCapacity, isActive } = row.original;
        const isFull = currentCapacity >= maxCapacity;
        
        return (
          <div className="space-y-1">
            <Badge 
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-green-100 text-green-800' : ''}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            {isFull && isActive && (
              <Badge 
                variant="destructive" 
                className="bg-red-100 text-red-800 text-xs"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Full
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
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
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Package className="mr-2 h-4 w-4" />
              View Packages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Bin
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => {
                if (confirm('Are you sure you want to delete this bin location? This action cannot be undone.')) {
                  deleteBinLocation.mutate(row.original.id);
                }
              }}
              disabled={row.original.currentCapacity > 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Bin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [formatCurrency, getCapacityColor, getCapacityPercentage, deleteBinLocation]);

  // Get unique zones for filter
  const zones = useMemo(() => {
    const uniqueZones = [...new Set(binLocations.map(bin => bin.zoneName))];
    return uniqueZones.sort();
  }, [binLocations]);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bin Locations</h3>
          <p className="text-sm text-gray-600">Manage storage locations within this warehouse</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Bin Location
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bins</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Near Full</p>
                <p className="text-xl font-bold">{stats.nearFull}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Full</p>
                <p className="text-xl font-bold">{stats.full}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Bin Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bin locations..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select
              value={filters.zoneName || 'all'}
              onValueChange={handleZoneChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map(zone => (
                  <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.isActive === undefined ? 'all' : filters.isActive ? 'true' : 'false'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.isAvailable === undefined ? 'all' : filters.isAvailable ? 'true' : 'false'}
              onValueChange={handleAvailabilityChange}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Available</SelectItem>
                <SelectItem value="false">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bin Locations Table */}
          <DataTable
            columns={columns}
            data={binLocations}
            isLoading={isLoading}
            onRefresh={refetch}
            pagination={response?.pagination}
            searchPlaceholder="Search bin locations..."
          />
    </div>
  );
}