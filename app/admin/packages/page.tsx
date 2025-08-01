// app/admin/packages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Package, Eye, Edit, MoreHorizontal, Truck, XCircle, Plus, Download, AlertCircle, CheckCircle, Clock, MapPin, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { DataTable } from '@/shared/components/data-table/data-table';

interface PackageData {
  id: string;
  internalId: string;
  trackingNumberInbound: string | null;
  senderName: string | null;
  description: string | null;
  status: string;
  weightActualKg: number;
  estimatedValue: number;
  estimatedValueCurrency: string;
  receivedAt: string | null;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  warehouseName: string;
  warehouseCode: string;
}

interface PackagesResponse {
  data: PackageData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface PackageFilters {
  search?: string;
  status?: string;
  warehouseId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'expected':
        return { label: 'Expected', variant: 'secondary' as const, icon: Clock };
      case 'received':
        return { label: 'Received', variant: 'default' as const, icon: CheckCircle };
      case 'processing':
        return { label: 'Processing', variant: 'outline' as const, icon: Clock };
      case 'ready_to_ship':
        return { label: 'Ready to Ship', variant: 'default' as const, icon: CheckCircle };
      case 'shipped':
        return { label: 'Shipped', variant: 'default' as const, icon: Truck };
      case 'delivered':
        return { label: 'Delivered', variant: 'default' as const, icon: CheckCircle };
      case 'returned':
        return { label: 'Returned', variant: 'secondary' as const, icon: AlertCircle };
      case 'disposed':
        return { label: 'Disposed', variant: 'destructive' as const, icon: XCircle };
      case 'missing':
        return { label: 'Missing', variant: 'destructive' as const, icon: AlertCircle };
      case 'damaged':
        return { label: 'Damaged', variant: 'destructive' as const, icon: AlertCircle };
      case 'held':
        return { label: 'Held', variant: 'outline' as const, icon: AlertCircle };
      default:
        return { label: status, variant: 'secondary' as const, icon: Clock };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Package Actions component
function PackageActions({ packageData }: { packageData: PackageData }) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/admin/packages/${packageData.id}`);
  };

  const handleEdit = () => {
    router.push(`/admin/packages/${packageData.id}/edit`);
  };

  const handleCreateShipment = () => {
    router.push(`/admin/shipments/create?packageId=${packageData.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewDetails}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Package
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateShipment}>
          <Truck className="mr-2 h-4 w-4" />
          Create Shipment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<PackageFilters>({});

  // Define table columns
  const columns: ColumnDef<PackageData>[] = [
    {
      accessorKey: 'internalId',
      header: 'Internal ID',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          <Button
            variant="link"
            className="p-0 h-auto font-mono text-sm"
            onClick={() => router.push(`/admin/packages/${row.original.id}`)}
          >
            {row.getValue('internalId')}
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'trackingNumberInbound',
      header: 'Tracking Number',
      cell: ({ row }) => {
        const trackingNumber = row.getValue('trackingNumberInbound') as string;
        return trackingNumber ? (
          <div className="font-mono text-xs">{trackingNumber}</div>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('customerName')}</div>
          <div className="text-sm text-gray-500">{row.original.customerEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string;
        return description ? (
          <div className="max-w-[200px] truncate" title={description}>
            {description}
          </div>
        ) : (
          <span className="text-gray-400">No description</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'weightActualKg',
      header: 'Weight',
      cell: ({ row }) => {
        const weight = row.getValue('weightActualKg') as number;
        return weight ? `${weight.toFixed(1)} kg` : '-';
      },
    },
    {
      accessorKey: 'estimatedValue',
      header: 'Value',
      cell: ({ row }) => {
        const value = row.getValue('estimatedValue') as number;
        const currency = row.original.estimatedValueCurrency;
        return value ? `${currency} ${value.toFixed(2)}` : '-';
      },
    },
    {
      accessorKey: 'warehouseName',
      header: 'Warehouse',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{row.original.warehouseCode}</span>
        </div>
      ),
    },
    {
      accessorKey: 'receivedAt',
      header: 'Received',
      cell: ({ row }) => {
        const receivedAt = row.getValue('receivedAt') as string;
        return receivedAt ? (
          <div className="text-sm">
            {new Date(receivedAt).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-gray-400">Not received</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <PackageActions packageData={row.original} />,
    },
  ];

  // Fetch packages
  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError('');

      const searchParams = new URLSearchParams();
      searchParams.set('page', pagination.page.toString());
      searchParams.set('limit', pagination.limit.toString());

      if (filters.search) searchParams.set('search', filters.search);
      if (filters.status) searchParams.set('status', filters.status);
      if (filters.warehouseId) searchParams.set('warehouseId', filters.warehouseId);
      if (filters.customerId) searchParams.set('customerId', filters.customerId);
      if (filters.dateFrom) searchParams.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) searchParams.set('dateTo', filters.dateTo);

      const response = await fetch(`/api/admin/packages?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }

      const data: PackagesResponse = await response.json();
      setPackages(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [pagination.page, pagination.limit, filters]);

  const handlePaginationChange = (page: number, limit: number) => {
    setPagination(prev => ({ ...prev, page, limit }));
  };

  const handleFilterChange = (newFilters: Partial<PackageFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
          <p className="text-muted-foreground">
            Manage and track all packages in your warehouses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/packages/receiving">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Package Receiving
            </Button>
          </Link>
          <Link href="/admin/packages/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search packages..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => 
                  handleFilterChange({ status: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="expected">Expected</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                placeholder="From date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                placeholder="To date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
              />
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Packages ({packages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={packages}
            isLoading={loading}
            onRefresh={fetchPackages}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            searchPlaceholder="Search packages..."
          />
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-600 bg-red-50 p-4 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}