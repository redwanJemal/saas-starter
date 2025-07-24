'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Users, Eye, Edit, MoreHorizontal, Mail, Phone, Shield, UserX, Package, Truck, DollarSign, Plus, Download } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Link from 'next/link';

interface CustomerData {
  id: string;
  customerId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  kycStatus: string;
  riskLevel: string;
  totalSpent: number;
  totalPackages: number;
  totalShipments: number;
  createdAt: string;
  lastLoginAt: string | null;
  status: string;
}

interface CustomersResponse {
  customers: CustomerData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// KYC Status Badge
function KycStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not_required':
        return { label: 'Not Required', variant: 'secondary' as const };
      case 'pending':
        return { label: 'Pending Review', variant: 'outline' as const };
      case 'approved':
        return { label: 'Approved', variant: 'default' as const };
      case 'rejected':
        return { label: 'Rejected', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const config = getStatusConfig(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Risk Level Badge
function RiskLevelBadge({ level }: { level: string }) {
  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'low':
        return { label: 'Low Risk', variant: 'default' as const };
      case 'medium':
        return { label: 'Medium Risk', variant: 'outline' as const };
      case 'high':
        return { label: 'High Risk', variant: 'destructive' as const };
      default:
        return { label: level, variant: 'secondary' as const };
    }
  };

  const config = getLevelConfig(level);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', variant: 'default' as const };
      case 'inactive':
        return { label: 'Inactive', variant: 'secondary' as const };
      case 'suspended':
        return { label: 'Suspended', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const config = getStatusConfig(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Filters
  const [search, setSearch] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination?.page || 1).toString(),
        limit: (pagination?.limit || 20).toString(),
        ...(search && { search }),
        ...(kycStatusFilter && { kyc_status: kycStatusFilter }),
        ...(riskLevelFilter && { risk_level: riskLevelFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      const data: CustomersResponse = await response.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit, search, kycStatusFilter, riskLevelFilter, statusFilter]);

  const handlePaginationChange = (page: number, limit: number) => {
    setPagination(prev => ({ ...prev, page, limit }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCustomerInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';
  };

  const columns: ColumnDef<CustomerData>[] = [
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getCustomerInitials(row.original.firstName, row.original.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">
              {row.original.firstName && row.original.lastName
                ? `${row.original.firstName} ${row.original.lastName}`
                : row.original.email}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {row.original.customerId}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-32">{row.original.email}</span>
            </div>
            {row.original.phone && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                <span>{row.original.phone}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'kycStatus',
      header: 'KYC Status',
      cell: ({ row }) => <KycStatusBadge status={row.original.kycStatus} />,
    },
    {
      accessorKey: 'riskLevel',
      header: 'Risk Level',
      cell: ({ row }) => <RiskLevelBadge level={row.original.riskLevel} />,
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total Spent',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatCurrency(row.original.totalSpent)}
        </div>
      ),
    },
    {
      accessorKey: 'activity',
      header: 'Activity',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs">
            <Package className="h-3 w-3" />
            <span>{row.original.totalPackages} packages</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Truck className="h-3 w-3" />
            <span>{row.original.totalShipments} shipments</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => (
        <div className="text-xs text-gray-500">
          {formatDate(row.original.lastLoginAt)}
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
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              Review KYC
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <UserX className="mr-2 h-4 w-4" />
              Suspend Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={kycStatusFilter} onValueChange={setKycStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by KYC status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All KYC Statuses</SelectItem>
          <SelectItem value="not_required">Not Required</SelectItem>
          <SelectItem value="pending">Pending Review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
      <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by risk level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Risk Levels</SelectItem>
          <SelectItem value="low">Low Risk</SelectItem>
          <SelectItem value="medium">Medium Risk</SelectItem>
          <SelectItem value="high">High Risk</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Link href="/admin/customers/create">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage customer accounts and profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {pagination?.total || 0} total
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {customers.filter(c => c.totalSpent > 0).length} paying
          </Badge>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchKey="email"
        searchPlaceholder="Search customers..."
        isLoading={loading}
        loadingMessage="Loading customers..."
        emptyMessage="No customers found."
        onRefresh={fetchCustomers}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        filters={filters}
        actions={actions}
      />
    </div>
  );
}