'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FileText, Eye, Edit, MoreHorizontal, DollarSign, Download, Send, Plus, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import Link from 'next/link';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  taxAmount: number | null;
  discountAmount: number | null;
  dueDate: string | null;
  paidAt: string | null;
  issuedAt: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  shipmentId: string | null;
}

interface InvoicesResponse {
  invoices: InvoiceData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Status badge component
function PaymentStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
      case 'paid':
        return { label: 'Paid', variant: 'default' as const, icon: CheckCircle };
      case 'partially_paid':
        return { label: 'Partially Paid', variant: 'outline' as const, icon: Clock };
      case 'overdue':
        return { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'secondary' as const, icon: AlertCircle };
      case 'refunded':
        return { label: 'Refunded', variant: 'outline' as const, icon: AlertCircle };
      default:
        return { label: status, variant: 'outline' as const, icon: Clock };
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

// Invoice type badge component
function InvoiceTypeBadge({ type }: { type: string }) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'shipping':
        return { label: 'Shipping', variant: 'default' as const };
      case 'storage':
        return { label: 'Storage', variant: 'secondary' as const };
      case 'handling':
        return { label: 'Handling', variant: 'outline' as const };
      case 'personal_shopper':
        return { label: 'Personal Shopper', variant: 'secondary' as const };
      case 'customs_duty':
        return { label: 'Customs Duty', variant: 'destructive' as const };
      case 'insurance':
        return { label: 'Insurance', variant: 'outline' as const };
      case 'other':
        return { label: 'Other', variant: 'secondary' as const };
      default:
        return { label: type, variant: 'outline' as const };
    }
  };

  const config = getTypeConfig(type);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
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
  const [typeFilter, setTypeFilter] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination?.page || 1).toString(),
        limit: (pagination?.limit || 20).toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter })
      });

      const response = await fetch(`/api/admin/invoices?${params}`);
      const data: InvoicesResponse = await response.json();
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, pagination.limit, search, statusFilter, typeFilter]);

  const handlePaginationChange = (page: number, limit: number) => {
    setPagination(prev => ({ ...prev, page, limit }));
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string | null, paymentStatus: string) => {
    if (!dueDate || paymentStatus === 'paid' || paymentStatus === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  const columns: ColumnDef<InvoiceData>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.invoiceNumber}</div>
          <div className="text-xs text-gray-500">
            Issued: {formatDate(row.original.issuedAt)}
          </div>
          {row.original.shipmentId && (
            <div className="text-xs text-blue-600">
              Shipment: {row.original.shipmentId}
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
          <div className="text-xs text-gray-500">{row.original.customerEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: 'invoiceType',
      header: 'Type',
      cell: ({ row }) => <InvoiceTypeBadge type={row.original.invoiceType} />,
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Status',
      cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {formatCurrency(row.original.totalAmount, row.original.currency)}
          </div>
          {row.original.taxAmount && (
            <div className="text-xs text-gray-500">
              Tax: {formatCurrency(row.original.taxAmount, row.original.currency)}
            </div>
          )}
          {row.original.discountAmount && (
            <div className="text-xs text-green-600">
              Discount: -{formatCurrency(row.original.discountAmount, row.original.currency)}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <div>
          <div className={`text-sm ${
            isOverdue(row.original.dueDate, row.original.paymentStatus) 
              ? 'text-red-600 font-medium' 
              : ''
          }`}>
            {formatDate(row.original.dueDate)}
          </div>
          {row.original.paidAt && (
            <div className="text-xs text-green-600">
              Paid: {formatDate(row.original.paidAt)}
            </div>
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
              <Eye className="mr-2 h-4 w-4" />
              View Invoice
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Send className="mr-2 h-4 w-4" />
              Send to Customer
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Invoice
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.original.paymentStatus === 'pending' && (
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                Mark as Paid
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-red-600">
              <AlertCircle className="mr-2 h-4 w-4" />
              Cancel Invoice
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
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partially_paid">Partially Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Types</SelectItem>
          <SelectItem value="shipping">Shipping</SelectItem>
          <SelectItem value="storage">Storage</SelectItem>
          <SelectItem value="handling">Handling</SelectItem>
          <SelectItem value="personal_shopper">Personal Shopper</SelectItem>
          <SelectItem value="customs_duty">Customs Duty</SelectItem>
          <SelectItem value="insurance">Insurance</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Link href="/admin/invoices/create">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
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
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage billing and payment processing</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {pagination?.total || 0} total
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {invoices.filter(i => i.paymentStatus === 'pending').length} pending
          </Badge>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        searchKey="invoiceNumber"
        searchPlaceholder="Search invoices..."
        isLoading={loading}
        loadingMessage="Loading invoices..."
        emptyMessage="No invoices found."
        onRefresh={fetchInvoices}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        filters={filters}
        actions={actions}
      />
    </div>
  );
}