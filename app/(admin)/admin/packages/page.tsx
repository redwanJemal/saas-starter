'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Package, Eye, Edit, MoreHorizontal, Truck, XCircle, Plus, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Link from 'next/link';

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
  packages: PackageData[];
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

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageData[]>([]);
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
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination?.page || 1).toString(),
        limit: (pagination?.limit || 20).toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(warehouseFilter && { warehouse_id: warehouseFilter })
      });

      const response = await fetch(`/api/admin/packages?${params}`);
      const data: PackagesResponse = await response.json();
      setPackages(data.packages);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [pagination?.page, pagination?.limit, search, statusFilter, warehouseFilter]);

  const handlePaginationChange = (page: number, limit: number) => {
    setPagination(prev => ({ ...prev, page, limit }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatWeight = (weight: unknown): string => {
    const num = Number(weight);
    return Number.isFinite(num) ? `${num.toFixed(1)} kg` : 'N/A';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const columns: ColumnDef<PackageData>[] = [
    {
      accessorKey: 'internalId',
      header: 'Package ID',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.internalId}</div>
          {row.original.trackingNumberInbound && (
            <div className="text-xs text-gray-500">
              Track: {row.original.trackingNumberInbound}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customerName}</div>
          <div className="text-xs text-gray-500">
            {row.original.customerId}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'senderName',
      header: 'Sender',
      cell: ({ row }) => (
        <div className="max-w-32 truncate">
          {row.original.senderName || 'Unknown'}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-40 truncate" title={row.original.description || ''}>
          {row.original.description || 'No description'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'weightActualKg',
      header: 'Weight',
      cell: ({ row }) => formatWeight(row.original.weightActualKg),
    },
    {
      accessorKey: 'estimatedValue',
      header: 'Value',
      cell: ({ row }) => formatCurrency(row.original.estimatedValue, row.original.estimatedValueCurrency),
    },
    {
      accessorKey: 'warehouseCode',
      header: 'Warehouse',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.warehouseCode}
        </Badge>
      ),
    },
    {
      accessorKey: 'receivedAt',
      header: 'Received',
      cell: ({ row }) => formatDate(row.original.receivedAt),
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
              Edit Package
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Truck className="mr-2 h-4 w-4" />
              Create Shipment
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              Mark as Missing
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
          <SelectItem value="expected">Expected</SelectItem>
          <SelectItem value="received">Received</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="held">Held</SelectItem>
          <SelectItem value="missing">Missing</SelectItem>
          <SelectItem value="damaged">Damaged</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Link href="/admin/packages/create">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </Link>
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-600">Manage incoming packages and inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {pagination?.total || 0} total
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {packages?.filter(p => p.status === 'ready_to_ship').length || 0} ready
          </Badge>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={packages}
        searchKey="internalId"
        searchPlaceholder="Search packages..."
        isLoading={loading}
        loadingMessage="Loading packages..."
        emptyMessage="No packages found."
        onRefresh={fetchPackages}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        filters={filters}
        actions={actions}
      />
    </div>
  );
}