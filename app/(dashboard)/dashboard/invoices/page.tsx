// app/(dashboard)/dashboard/invoices/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FileText, Eye, Download, CreditCard, Search, Filter, RefreshCw, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, ExternalLink, ArrowUpRight, TrendingUp, Loader2, Receipt, Building, Truck, ShoppingCart, Package } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatWeight } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyCode: string;
  paidAmount: number;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  issuedAt: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  shipmentId?: string;
  shipmentNumber?: string;
  shipmentStatus?: string;
}

interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  overdueAmount: number;
}

interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: InvoiceSummary;
}

// Payment Status Badge Component
function PaymentStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' };
      case 'paid':
        return { label: 'Paid', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' };
      case 'partially_paid':
        return { label: 'Partially Paid', variant: 'outline' as const, icon: Clock, color: 'text-blue-600' };
      case 'overdue':
        return { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'secondary' as const, icon: AlertCircle, color: 'text-gray-600' };
      case 'refunded':
        return { label: 'Refunded', variant: 'outline' as const, icon: AlertCircle, color: 'text-purple-600' };
      default:
        return { label: status, variant: 'outline' as const, icon: Clock, color: 'text-gray-600' };
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

// Invoice Type Badge Component
function InvoiceTypeBadge({ type }: { type: string }) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'shipping':
        return { label: 'Shipping', icon: Truck, color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'storage':
        return { label: 'Storage', icon: Package, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'handling':
        return { label: 'Handling', icon: Receipt, color: 'bg-green-50 text-green-700 border-green-200' };
      case 'personal_shopper':
        return { label: 'Personal Shopping', icon: ShoppingCart, color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'customs_duty':
        return { label: 'Customs & Duty', icon: Building, color: 'bg-red-50 text-red-700 border-red-200' };
      case 'insurance':
        return { label: 'Insurance', icon: FileText, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: type, icon: FileText, color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Summary Cards Component
function InvoiceSummaryCards({ summary, isLoading }: { summary: InvoiceSummary | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const summaryCards = [
    {
      title: 'Total Invoices',
      value: summary.totalInvoices,
      subtitle: `$${formatWeight(summary.totalAmount)} total`,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Paid Amount',
      value: `$${formatWeight(summary.totalPaid)}`,
      subtitle: `${summary.totalInvoices - summary.pendingCount - summary.overdueCount} invoices`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Payment',
      value: `$${formatWeight(summary.pendingAmount)}`,
      subtitle: `${summary.pendingCount} invoices`,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Overdue',
      value: `$${formatWeight(summary.overdueAmount)}`,
      subtitle: `${summary.overdueCount} invoices`,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {summaryCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Main Invoice Table Component
function InvoiceTable({ invoices, isLoading, onRefresh }: { 
  invoices: Invoice[]; 
  isLoading: boolean; 
  onRefresh: () => void; 
}) {
  const handlePayNow = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/customer/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      // Show error toast/alert here
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Invoices</CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600">You don't have any invoices yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const balanceDue = invoice.totalAmount - invoice.paidAmount;
              const canPay = invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'overdue';
              
              return (
                <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                        <InvoiceTypeBadge type={invoice.invoiceType} />
                        <PaymentStatusBadge status={invoice.paymentStatus} />
                        {invoice.shipmentNumber && (
                          <Link 
                            href={`/dashboard/shipments?search=${invoice.shipmentNumber}`}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Truck className="h-3 w-3" />
                            {invoice.shipmentNumber}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium">{invoice.currencyCode} {formatWeight(invoice.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Issued Date</p>
                          <p className="font-medium">{format(new Date(invoice.issuedAt), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Due Date</p>
                          <p className="font-medium">
                            {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Balance Due</p>
                          <p className={`font-medium ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {invoice.currencyCode} {formatWeight(balanceDue)}
                          </p>
                        </div>
                      </div>

                      {invoice.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <p className="text-gray-600">{invoice.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      
                      {canPay && balanceDue > 0 && (
                        <Button 
                          size="sm"
                          onClick={() => handlePayNow(invoice.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Invoices Page Component
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('none');
  const [typeFilter, setTypeFilter] = useState('none');

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'none' && { paymentStatus: statusFilter }),
        ...(typeFilter !== 'none' && { invoiceType: typeFilter }),
      });

      const response = await fetch(`/api/customer/invoices?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data: InvoicesResponse = await response.json();
      setInvoices(data.invoices);
      setSummary(data.summary);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Show error toast/alert here
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">View and manage your billing invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <InvoiceSummaryCards summary={summary} isLoading={isLoading} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Payment Status" />
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

            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Invoice Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Types</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="handling">Handling</SelectItem>
                <SelectItem value="personal_shopper">Personal Shopping</SelectItem>
                <SelectItem value="customs_duty">Customs & Duty</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <InvoiceTable invoices={invoices} isLoading={isLoading} onRefresh={fetchInvoices} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}