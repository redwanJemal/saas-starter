'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Warehouse, Eye, Edit, MoreHorizontal, Package, Truck, MapPin, Phone, Mail, Plus, Settings, Building } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Link from 'next/link';

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  status: string;
  addressLine1: string;
  city: string;
  stateProvince: string | null;
  countryCode: string;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  currencyCode: string;
  maxPackageWeightKg: number;
  maxPackageValue: number;
  acceptsNewPackages: boolean;
  createdAt: string;
  stats: {
    totalPackages: number;
    pendingPackages: number;
    readyPackages: number;
    totalShipments: number;
    activeShipments: number;
  };
}

interface WarehousesResponse {
  warehouses: WarehouseData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', variant: 'default' as const };
      case 'inactive':
        return { label: 'Inactive', variant: 'secondary' as const };
      case 'maintenance':
        return { label: 'Maintenance', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const config = getStatusConfig(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/warehouses?${params}`);
      const data: WarehousesResponse = await response.json();
      setWarehouses(data.warehouses);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [pagination.page, pagination.limit, search, statusFilter]);

  const handlePaginationChange = (page: number, limit: number) => {
    setPagination(prev => ({ ...prev, page, limit }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(1)} kg`;
  };

  const columns: ColumnDef<WarehouseData>[] = [
    {
      accessorKey: 'name',
      header: 'Warehouse',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-gray-500">Code: {row.original.code}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <MapPin className="h-3 w-3" />
            <span>{row.original.city}, {row.original.countryCode}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="space-y-2">
          <StatusBadge status={row.original.status} />
          {row.original.acceptsNewPackages ? (
            <Badge variant="outline" className="text-green-600">
              Accepting Packages
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600">
              Not Accepting
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.email && (
            <div className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-32">{row.original.email}</span>
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Phone className="h-3 w-3" />
              <span>{row.original.phone}</span>
            </div>
          )}
          {row.original.timezone && (
            <div className="text-xs text-gray-500">
              TZ: {row.original.timezone}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'limits',
      header: 'Limits',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-xs">
            Max Weight: {formatWeight(row.original.maxPackageWeightKg)}
          </div>
          <div className="text-xs">
            Max Value: {formatCurrency(row.original.maxPackageValue, row.original.currencyCode)}
          </div>
          <div className="text-xs text-gray-500">
            Currency: {row.original.currencyCode}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'packages',
      header: 'Packages',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Package className="h-3 w-3" />
            <span>{row.original.stats.totalPackages} total</span>
          </div>
          <div className="text-xs text-orange-600">
            {row.original.stats.pendingPackages} pending
          </div>
          <div className="text-xs text-green-600">
            {row.original.stats.readyPackages} ready
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'shipments',
      header: 'Shipments',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Truck className="h-3 w-3" />
            <span>{row.original.stats.totalShipments} total</span>
          </div>
          <div className="text-xs text-blue-600">
            {row.original.stats.activeShipments} active
          </div>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Warehouse
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Package className="mr-2 h-4 w-4" />
              Manage Packages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Building className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Link href="/admin/warehouses/create">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </Link>
      <Button variant="outline" size="sm">
        <Settings className="mr-2 h-4 w-4" />
        Bulk Configure
      </Button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-600">Manage warehouse locations and operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Warehouse className="h-3 w-3" />
            {pagination.total} total
          </Badge>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        searchKey="name"
        searchPlaceholder="Search warehouses..."
        isLoading={loading}
        loadingMessage="Loading warehouses..."
        emptyMessage="No warehouses found."
        onRefresh={fetchWarehouses}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        filters={filters}
        actions={actions}
      />
    </div>
  );
}