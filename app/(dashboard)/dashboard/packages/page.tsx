// app/(dashboard)/dashboard/packages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Truck, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter,
  Eye,
  Download,
  ExternalLink,
  Weight,
  DollarSign,
  Ruler
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Package {
  id: string;
  internalId: string;
  trackingNumberInbound: string;
  status: string;
  senderName: string;
  description: string;
  weightActualKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  estimatedValue: number;
  estimatedValueCurrency: string;
  expectedArrivalDate: string;
  receivedAt: string;
  readyToShipAt: string;
  storageExpiresAt: string;
  isFragile: boolean;
  isHighValue: boolean;
  warehouseName: string;
  courierTrackingUrl: string;
  courierName: string;
  createdAt: string;
  updatedAt: string;
}

interface IncomingShipmentItem {
  id: string;
  trackingNumber: string;
  courierTrackingUrl: string;
  assignmentStatus: string;
  scannedAt: string;
  assignedAt: string;
  batchReference: string;
  courierName: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [incomingItems, setIncomingItems] = useState<IncomingShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [activeTab, setActiveTab] = useState('packages');

  useEffect(() => {
    // Check URL params for initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'incoming') {
      setActiveTab('incoming');
    }
    
    fetchPackages();
    fetchIncomingItems();
  }, [pagination.page, statusFilter]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : ''
      });

      const response = await fetch(`/api/customer/packages?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setPackages(data.packages || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingItems = async () => {
    try {
      const response = await fetch('/api/customer/incoming-items');
      const data = await response.json();
      
      if (response.ok) {
        setIncomingItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching incoming items:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expected':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'received':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready_to_ship':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expected':
        return <Clock className="h-4 w-4" />;
      case 'received':
        return <Package className="h-4 w-4" />;
      case 'ready_to_ship':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatWeight = (weightKg: number) => {
    if (!weightKg) return 'N/A';
    return `${weightKg} kg`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDimensions = (length: number, width: number, height: number) => {
    if (!length || !width || !height) return 'N/A';
    return `${length} × ${width} × ${height} cm`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Packages</h1>
          <p className="text-gray-600 mt-1">
            Track your incoming packages and manage your shipments
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">Received Packages</TabsTrigger>
          <TabsTrigger value="incoming">
            Incoming Items
            {incomingItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {incomingItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Packages</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by tracking number, sender, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="status">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="expected">Expected</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchPackages} disabled={loading}>
                    <Filter className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packages List */}
          {loading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 rounded w-64"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : packages.length > 0 ? (
            <div className="grid gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{pkg.internalId}</h3>
                          <p className="text-sm text-gray-600">
                            {pkg.trackingNumberInbound}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(pkg.status)}>
                        {getStatusIcon(pkg.status)}
                        <span className="ml-1 capitalize">{pkg.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">From</p>
                          <p className="text-sm font-medium">{pkg.courierName || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="text-sm font-medium">{formatWeight(pkg.weightActualKg)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Dimensions</p>
                          <p className="text-sm font-medium">
                            {formatDimensions(pkg.lengthCm, pkg.widthCm, pkg.heightCm)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Value</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(pkg.estimatedValue, pkg.estimatedValueCurrency)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {pkg.description && (
                      <p className="text-sm text-gray-700 mb-4">{pkg.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {pkg.receivedAt && (
                          <span>Received {format(new Date(pkg.receivedAt), 'MMM d, yyyy')}</span>
                        )}
                        {pkg.expectedArrivalDate && !pkg.receivedAt && (
                          <span>Expected {format(new Date(pkg.expectedArrivalDate), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {pkg.courierTrackingUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={pkg.courierTrackingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Track
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/packages/${pkg.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                <p className="text-gray-600">
                  {statusFilter !== 'all' || searchTerm
                    ? 'Try adjusting your filters to see more packages.'
                    : 'Your packages will appear here once they arrive at our warehouse.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} packages
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Incoming Items (Not Yet Processed)
              </CardTitle>
              <p className="text-sm text-gray-600">
                These items have arrived at our warehouse but haven't been fully processed yet.
                You'll receive a notification once they're ready.
              </p>
            </CardHeader>
            <CardContent>
              {incomingItems.length > 0 ? (
                <div className="space-y-3">
                  {incomingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Package className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{item.trackingNumber}</p>
                          <p className="text-sm text-gray-600">
                            {item.courierName} • Batch: {item.batchReference}
                          </p>
                          <p className="text-xs text-gray-500">
                            Scanned: {format(new Date(item.scannedAt), 'MMM d, yyyy HH:mm')}
                            {item.assignedAt && (
                              <span> • Assigned: {format(new Date(item.assignedAt), 'MMM d, yyyy HH:mm')}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          {item.assignmentStatus}
                        </Badge>
                        {item.courierTrackingUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={item.courierTrackingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-600">
                    No incoming items waiting to be processed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}