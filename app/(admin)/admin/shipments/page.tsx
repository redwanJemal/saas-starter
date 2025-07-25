'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Truck, Eye, Edit, MoreHorizontal, Package, DollarSign, MapPin, Clock, Plus, Download } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Link from 'next/link';

interface ShipmentData {
  id: string;
  internalId: string;
  trackingNumber: string | null;
  status: string;
  totalWeight: number;
  totalValue: number;
  valueCurrency: string;
  totalCost: number;
  costCurrency: string;
  shippingMethod: string;
  carrierName: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  warehouseName: string;
  warehouseCode: string;
  shippingCity: string | null;
  shippingCountry: string | null;
}

interface ShipmentsResponse {
  shipments: ShipmentData[];
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
      case 'quote_requested':
        return { label: 'Quote Requested', variant: 'secondary' as const };
      case 'quoted':
        return { label: 'Quoted', variant: 'outline' as const };
      case 'paid':
        return { label: 'Paid', variant: 'default' as const };
      case 'processing':
        return { label: 'Processing', variant: 'secondary' as const };
      case 'dispatched':
        return { label: 'Dispatched', variant: 'default' as const };
      case 'in_transit':
        return { label: 'In Transit', variant: 'default' as const };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', variant: 'default' as const };
      case 'delivered':
        return { label: 'Delivered', variant: 'default' as const };
      case 'delivery_failed':
        return { label: 'Delivery Failed', variant: 'destructive' as const };
      case 'returned':
        return { label: 'Returned', variant: 'secondary' as const };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'destructive' as const };
      case 'refunded':
        return { label: 'Refunded', variant: 'outline' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const config = getStatusConfig(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
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

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination?.page || 1).toString(),
        limit: (pagination?.limit || 20).toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(warehouseFilter && { warehouse_id: warehouseFilter })
      });

      const response = await fetch(`/api/admin/shipments?${params}`);
      const data: ShipmentsResponse = await response.json();
      setShipments(data.shipments);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [pagination.page, pagination.limit, search, statusFilter, warehouseFilter]);

  const handlePaginationChange = (page: number, limit: number) => {
    setPagination(prev => ({ ...prev, page, limit }));
  };

  const formatCurrency = (amount: number, currency: string | null = 'USD') => {
    const currencyCode = currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
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

  const columns: ColumnDef<ShipmentData>[] = [
    {
      accessorKey: 'internalId',
      header: 'Shipment ID',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.internalId}</div>
          {row.original.trackingNumber && (
            <div className="text-xs text-gray-500">
              Track: {row.original.trackingNumber}
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
          <div className="text-xs text-gray-500">{row.original.customerId}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'shippingMethod',
      header: 'Method',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.shippingMethod}</div>
          {row.original.carrierName && (
            <div className="text-xs text-gray-500">{row.original.carrierName}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'destination',
      header: 'Destination',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span className="text-sm">
            {row.original.shippingCity && row.original.shippingCountry
              ? `${row.original.shippingCity}, ${row.original.shippingCountry}`
              : 'Not set'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'weight',
      header: 'Weight',
      cell: ({ row }) => formatWeight(row.original.totalWeight),
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => formatCurrency(row.original.totalValue, row.original.valueCurrency),
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }) => formatCurrency(row.original.totalCost, row.original.costCurrency),
    },
    {
      accessorKey: 'warehouse',
      header: 'Warehouse',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.warehouseCode}
        </Badge>
      ),
    },
    {
      accessorKey: 'dates',
      header: 'Timeline',
      cell: ({ row }) => (
        <div className="text-xs space-y-1">
          <div>Created: {formatDate(row.original.createdAt)}</div>
          {row.original.dispatchedAt && (
            <div>Dispatched: {formatDate(row.original.dispatchedAt)}</div>
          )}
          {row.original.deliveredAt && (
            <div>Delivered: {formatDate(row.original.deliveredAt)}</div>
          )}
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
            <Link className='flex items-center gap-2' href={`/admin/shipments/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Shipment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Truck className="mr-2 h-4 w-4" />
              Track Shipment
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download Label
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
          <SelectItem value="quote_requested">Quote Requested</SelectItem>
          <SelectItem value="quoted">Quoted</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="dispatched">Dispatched</SelectItem>
          <SelectItem value="in_transit">In Transit</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Link href="/admin/shipments/create">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Shipment
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
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-gray-600">Manage and track all shipments</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {pagination?.total || 0} total
          </Badge>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={shipments}
        searchKey="internalId"
        searchPlaceholder="Search shipments..."
        isLoading={loading}
        loadingMessage="Loading shipments..."
        emptyMessage="No shipments found."
        onRefresh={fetchShipments}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        filters={filters}
        actions={actions}
      />
    </div>
  );
}