'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Warehouse, 
  MapPin, 
  Clock, 
  DollarSign, 
  Package, 
  Truck, 
  Users, 
  Settings,
  Edit,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Eye,
  Activity
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface WarehouseDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  email?: string;
  timezone: string;
  currencyCode: string;
  taxTreatment: string;
  storageFreeDays: number;
  storageFeePerDay: number;
  maxPackageWeightKg: number;
  maxPackageValue: number;
  acceptsNewPackages: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalPackages: number;
    pendingPackages: number;
    readyPackages: number;
    totalShipments: number;
    activeShipments: number;
  };
}

interface RecentPackage {
  id: string;
  internalId: string;
  status: string;
  customerName: string;
  senderName: string;
  receivedAt: string;
  weightActualKg: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;
  
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
  const [recentPackages, setRecentPackages] = useState<RecentPackage[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWarehouseDetails();
  }, [warehouseId]);

  const fetchWarehouseDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch warehouse details
      const warehouseResponse = await fetch(`/api/admin/warehouses/${warehouseId}`);
      if (!warehouseResponse.ok) {
        throw new Error('Failed to fetch warehouse details');
      }
      const warehouseData = await warehouseResponse.json();
      setWarehouse(warehouseData);

      // Fetch recent packages
      const packagesResponse = await fetch(`/api/admin/packages?warehouse_id=${warehouseId}&limit=5`);
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setRecentPackages(packagesData.packages || []);
      }

      // Mock recent activity - replace with real API call
      setRecentActivity([
        {
          id: '1',
          type: 'package_received',
          description: 'Package PKG-12345 received from Amazon',
          timestamp: '2 hours ago',
          user: 'John Smith'
        },
        {
          id: '2',
          type: 'shipment_created',
          description: 'Shipment SHP-67890 created for customer',
          timestamp: '4 hours ago',
          user: 'Sarah Wilson'
        },
        {
          id: '3',  
          type: 'package_processed',
          description: 'Package PKG-11111 marked as ready to ship',
          timestamp: '6 hours ago',
          user: 'Mike Johnson'
        }
      ]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatWeight = (weight: unknown): string => {
    const num = Number(weight);
    return Number.isFinite(num) ? `${num.toFixed(1)} kg` : 'N/A';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Maintenance
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPackageStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge variant="default">Received</Badge>;
      case 'processing':
        return <Badge variant="outline">Processing</Badge>;
      case 'ready_to_ship':
        return <Badge variant="default">Ready to Ship</Badge>;
      case 'shipped':
        return <Badge variant="secondary">Shipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/warehouses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Warehouses
            </Button>
          </Link>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/warehouses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Warehouses
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Warehouse</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchWarehouseDetails}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/warehouses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Warehouses
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Warehouse Not Found</h2>
          <p className="text-gray-600">The warehouse you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/warehouses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Warehouses
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
              {getStatusBadge(warehouse.status)}
            </div>
            <p className="text-gray-600">Code: {warehouse.code} • {warehouse.city}, {warehouse.countryCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/warehouses/${warehouse.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="mr-2 h-4 w-4" />
                View Activity Log
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Packages</p>
                <p className="text-2xl font-bold">{warehouse.stats.totalPackages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Packages</p>
                <p className="text-2xl font-bold">{warehouse.stats.pendingPackages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ready to Ship</p>
                <p className="text-2xl font-bold">{warehouse.stats.readyPackages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Shipments</p>
                <p className="text-2xl font-bold">{warehouse.stats.activeShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="packages">Recent Packages</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouse Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Warehouse Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {warehouse.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-sm text-gray-600">{warehouse.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(warehouse.status)}
                    {warehouse.acceptsNewPackages ? (
                      <Badge variant="outline" className="text-green-600">Accepting Packages</Badge>
                    ) : (
                      <Badge variant="secondary">Not Accepting Packages</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(warehouse.createdAt).toLocaleDateString()} at{' '}
                    {new Date(warehouse.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">
                    {warehouse.addressLine1}
                    {warehouse.addressLine2 && <><br />{warehouse.addressLine2}</>}
                    <br />
                    {warehouse.city}{warehouse.stateProvince && `, ${warehouse.stateProvince}`}
                    <br />
                    {warehouse.postalCode} {warehouse.countryCode}
                  </p>
                </div>
                {warehouse.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm text-gray-600">{warehouse.phone}</p>
                  </div>
                )}
                {warehouse.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-600">{warehouse.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">Timezone</p>
                  <p className="text-sm text-gray-600">{warehouse.timezone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Business Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Business Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Currency</p>
                    <p className="text-sm text-gray-600">{warehouse.currencyCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tax Treatment</p>
                    <p className="text-sm text-gray-600 capitalize">{warehouse.taxTreatment.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Free Storage Days</p>
                    <p className="text-sm text-gray-600">{warehouse.storageFreeDays} days</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Storage Fee</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(warehouse.storageFeePerDay, warehouse.currencyCode)}/day
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limits & Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>Limits & Restrictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Max Package Weight</p>
                  <p className="text-sm text-gray-600">{formatWeight(warehouse.maxPackageWeightKg)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Max Package Value</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(warehouse.maxPackageValue, warehouse.currencyCode)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Packages</CardTitle>
                <Link href={`/admin/packages?warehouse_id=${warehouse.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentPackages.length > 0 ? (
                <div className="space-y-4">
                  {recentPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Package className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{pkg.internalId}</p>
                          <p className="text-sm text-gray-600">
                            From: {pkg.senderName || 'Unknown'} • Customer: {pkg.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Received: {new Date(pkg.receivedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatWeight(pkg.weightActualKg)}</p>
                          {getPackageStatusBadge(pkg.status)}
                        </div>
                        <Link href={`/admin/packages/${pkg.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent packages found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border-l-2 border-gray-200">
                      <div className="p-1 bg-blue-100 rounded">
                        <Activity className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                          {activity.user && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-500">by {activity.user}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Warehouse Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Package Acceptance</h4>
                    <p className="text-sm text-gray-600">
                      Whether this warehouse accepts new incoming packages
                    </p>
                  </div>
                  <Badge variant={warehouse.acceptsNewPackages ? "default" : "secondary"}>
                    {warehouse.acceptsNewPackages ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Operating Status</h4>
                    <p className="text-sm text-gray-600">
                      Current operational status of the warehouse
                    </p>
                  </div>
                  {getStatusBadge(warehouse.status)}
                </div>

                <div className="pt-4">
                  <Link href={`/admin/warehouses/${warehouse.id}/edit`}>
                    <Button>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}