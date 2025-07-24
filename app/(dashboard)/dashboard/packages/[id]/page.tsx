// app/(dashboard)/dashboard/packages/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Truck, 
  Weight, 
  Ruler, 
  DollarSign, 
  FileText, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  MessageCircle,
  Shield,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface PackageDetail {
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
  volumetricWeightKg: number;
  estimatedValue: number;
  estimatedValueCurrency: string;
  expectedArrivalDate: string;
  receivedAt: string;
  readyToShipAt: string;
  storageExpiresAt: string;
  warehouseNotes: string;
  customerNotes: string;
  specialInstructions: string;
  isFragile: boolean;
  isHighValue: boolean;
  requiresAdultSignature: boolean;
  isRestricted: boolean;
  warehouseName: string;
  warehouseAddress: string;
  courierTrackingUrl: string;
  batchReference: string;
  courierName: string;
  createdAt: string;
  updatedAt: string;
}

interface StatusHistoryItem {
  id: string;
  status: string;
  notes: string;
  changeReason: string;
  createdAt: string;
  changedByName: string;
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;
  
  const [packageDetail, setPackageDetail] = useState<PackageDetail | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (packageId) {
      fetchPackageDetail();
      fetchStatusHistory();
    }
  }, [packageId]);

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/packages/${packageId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Package not found');
        } else if (response.status === 401) {
          setError('Unauthorized access');
        } else {
          setError('Failed to load package details');
        }
        return;
      }

      const data = await response.json();
      setPackageDetail(data.package);
    } catch (error) {
      console.error('Error fetching package detail:', error);
      setError('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(`/api/customer/packages/${packageId}/status-history`);
      if (response.ok) {
        const data = await response.json();
        setStatusHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !packageDetail) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Package not found'}
          </h2>
          <p className="text-gray-600 mb-4">
            The package you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/dashboard/packages')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard/packages')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{packageDetail.internalId}</h1>
            <p className="text-gray-600">{packageDetail.trackingNumberInbound}</p>
          </div>
        </div>
        <Badge className={getStatusColor(packageDetail.status)}>
          {getStatusIcon(packageDetail.status)}
          <span className="ml-1 capitalize">{packageDetail.status.replace('_', ' ')}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sender</p>
                    <p className="text-sm text-gray-600">{packageDetail.senderName || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Warehouse</p>
                    <p className="text-sm text-gray-600">{packageDetail.warehouseName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Weight className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Weight</p>
                    <p className="text-sm text-gray-600">
                      {formatWeight(packageDetail.weightActualKg)}
                      {packageDetail.volumetricWeightKg && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Vol: {formatWeight(packageDetail.volumetricWeightKg)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Ruler className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dimensions</p>
                    <p className="text-sm text-gray-600">
                      {formatDimensions(packageDetail.lengthCm, packageDetail.widthCm, packageDetail.heightCm)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Estimated Value</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(packageDetail.estimatedValue, packageDetail.estimatedValueCurrency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Received</p>
                    <p className="text-sm text-gray-600">
                      {packageDetail.receivedAt 
                        ? format(new Date(packageDetail.receivedAt), 'MMM d, yyyy HH:mm')
                        : 'Not yet received'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {packageDetail.description && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{packageDetail.description}</p>
                </div>
              )}

              {/* Package Flags */}
              {(packageDetail.isFragile || packageDetail.isHighValue || packageDetail.requiresAdultSignature || packageDetail.isRestricted) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Special Handling</h4>
                  <div className="flex flex-wrap gap-2">
                    {packageDetail.isFragile && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Fragile
                      </Badge>
                    )}
                    {packageDetail.isHighValue && (
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        <Shield className="mr-1 h-3 w-3" />
                        High Value
                      </Badge>
                    )}
                    {packageDetail.requiresAdultSignature && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        <FileText className="mr-1 h-3 w-3" />
                        Adult Signature Required
                      </Badge>
                    )}
                    {packageDetail.isRestricted && (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Restricted Item
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Additional Info */}
          <Tabs defaultValue="notes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="notes">Notes & Instructions</TabsTrigger>
              <TabsTrigger value="history">Status History</TabsTrigger>
            </TabsList>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Notes & Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {packageDetail.customerNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Customer Notes</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        {packageDetail.customerNotes}
                      </p>
                    </div>
                  )}
                  
                  {packageDetail.warehouseNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Warehouse Notes</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {packageDetail.warehouseNotes}
                      </p>
                    </div>
                  )}
                  
                  {packageDetail.specialInstructions && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Special Instructions</h4>
                      <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                        {packageDetail.specialInstructions}
                      </p>
                    </div>
                  )}

                  {!packageDetail.customerNotes && !packageDetail.warehouseNotes && !packageDetail.specialInstructions && (
                    <p className="text-sm text-gray-500 italic">No notes or special instructions.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusHistory.length > 0 ? (
                    <div className="space-y-4">
                      {statusHistory.map((item, index) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`p-2 rounded-full ${getStatusColor(item.status).replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 ')}`}>
                              {getStatusIcon(item.status)}
                            </div>
                            {index < statusHistory.length - 1 && (
                              <div className="w-px h-8 bg-gray-200 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium capitalize">
                                {item.status.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                            {item.notes && (
                              <p className="text-sm text-gray-600 mb-1">{item.notes}</p>
                            )}
                            {item.changeReason && (
                              <p className="text-xs text-gray-500">Reason: {item.changeReason}</p>
                            )}
                            {item.changedByName && (
                              <p className="text-xs text-gray-500">By: {item.changedByName}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No status history available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {packageDetail.courierTrackingUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={packageDetail.courierTrackingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Track with Courier
                  </a>
                </Button>
              )}
              
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
              
              {packageDetail.status === 'ready_to_ship' && (
                <Button className="w-full">
                  <Truck className="mr-2 h-4 w-4" />
                  Create Shipment
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {packageDetail.expectedArrivalDate && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Expected Arrival</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(packageDetail.expectedArrivalDate), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
              
              {packageDetail.receivedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Received</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(packageDetail.receivedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
              
              {packageDetail.readyToShipAt && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Ready to Ship</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(packageDetail.readyToShipAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
              
              {packageDetail.storageExpiresAt && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Storage Expires</p>
                  <p className="text-sm text-red-600">
                    {format(new Date(packageDetail.storageExpiresAt), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Batch Info */}
          {(packageDetail.batchReference || packageDetail.courierName) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Shipment Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {packageDetail.batchReference && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Batch Reference</p>
                    <p className="text-sm text-gray-600">{packageDetail.batchReference}</p>
                  </div>
                )}
                
                {packageDetail.courierName && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Courier</p>
                    <p className="text-sm text-gray-600">{packageDetail.courierName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}