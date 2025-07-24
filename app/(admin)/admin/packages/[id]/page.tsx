'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  Scale, 
  DollarSign, 
  Clock, 
  FileText,
  Edit,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Truck,
  Activity,
  Download,
  Eye,
  ExternalLink,
  Loader2,
  Save
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface PackageDetail {
  id: string;
  internalId: string;
  suiteCodeCaptured: string;
  trackingNumberInbound: string;
  senderName: string;
  senderCompany?: string;
  senderTrackingUrl?: string;
  description: string;
  estimatedValue: number;
  estimatedValueCurrency: string;
  weightActualKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumetricWeightKg?: number;
  status: string;
  expectedArrivalDate?: string;
  receivedAt: string;
  readyToShipAt?: string;
  storageExpiresAt?: string;
  warehouseNotes?: string;
  customerNotes?: string;
  specialInstructions?: string;
  isFragile: boolean;
  isHighValue: boolean;
  requiresAdultSignature: boolean;
  isRestricted: boolean;
  processedAt: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  warehouseName: string;
  warehouseCode: string;
  warehouseCity: string;
  warehouseCountry: string;
}

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string;
  changeReason?: string;
  createdAt: string;
  changedByName?: string;
  changedByEmail?: string;
}

interface PackageDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  isPublic: boolean;
  uploadNotes?: string;
  createdAt: string;
  uploadedByName?: string;
}

const PACKAGE_STATUSES = [
  { value: 'expected', label: 'Expected', color: 'gray' },
  { value: 'received', label: 'Received', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'yellow' },
  { value: 'ready_to_ship', label: 'Ready to Ship', color: 'green' },
  { value: 'shipped', label: 'Shipped', color: 'purple' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'returned', label: 'Returned', color: 'orange' },
  { value: 'disposed', label: 'Disposed', color: 'red' },
  { value: 'missing', label: 'Missing', color: 'red' },
  { value: 'damaged', label: 'Damaged', color: 'red' },
  { value: 'held', label: 'Held', color: 'yellow' },
];

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;
  
  const [packageDetail, setPackageDetail] = useState<PackageDetail | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [documents, setDocuments] = useState<PackageDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/packages/${packageId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch package details');
      }
      
      const data = await response.json();
      setPackageDetail(data.package);
      setStatusHistory(data.statusHistory || []);
      setDocuments(data.documents || []);
      setNewStatus(data.package.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!packageDetail || newStatus === packageDetail.status) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          statusNotes,
          changeReason: changeReason || 'manual_update',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update package status');
      }

      // Refresh package details
      await fetchPackageDetails();
      setStatusNotes('');
      setChangeReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = PACKAGE_STATUSES.find(s => s.value === status);
    const config = statusConfig || { label: status, color: 'gray' };
    
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colorClasses[config.color as keyof typeof colorClasses] || colorClasses.gray}>
        {config.label}
      </Badge>
    );
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/packages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packages
            </Button>
          </Link>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <Link href="/admin/packages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packages
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Package</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchPackageDetails}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!packageDetail) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/packages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packages
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Package Not Found</h2>
          <p className="text-gray-600">The package you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/packages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packages
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{packageDetail.internalId}</h1>
              {getStatusBadge(packageDetail.status)}
            </div>
            <p className="text-gray-600">
              {packageDetail.warehouseName} • {packageDetail.customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Truck className="mr-2 h-4 w-4" />
                Create Shipment
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Generate Label
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="mr-2 h-4 w-4" />
                View Activity Log
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Scale className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Actual Weight</p>
                <p className="text-xl font-bold">{formatWeight(packageDetail.weightActualKg)}</p>
                {packageDetail.volumetricWeightKg && (
                  <p className="text-xs text-gray-500">
                    Vol: {formatWeight(packageDetail.volumetricWeightKg)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Value</p>
                <p className="text-xl font-bold">
                  {formatCurrency(packageDetail.estimatedValue, packageDetail.estimatedValueCurrency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Received</p>
                <p className="text-lg font-bold">
                  {new Date(packageDetail.receivedAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(packageDetail.receivedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Package Details</TabsTrigger>
          <TabsTrigger value="status">Status Management</TabsTrigger>
          <TabsTrigger value="history">Status History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Package Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Package Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Internal ID</p>
                    <p className="text-gray-600">{packageDetail.internalId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Suite Code</p>
                    <p className="text-gray-600">{packageDetail.suiteCodeCaptured}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Tracking Number</p>
                    <p className="text-gray-600">{packageDetail.trackingNumberInbound || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Status</p>
                    {getStatusBadge(packageDetail.status)}
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-gray-700 mb-2">Description</p>
                  <p className="text-gray-600 text-sm">{packageDetail.description}</p>
                </div>

                {packageDetail.specialInstructions && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Special Instructions</p>
                    <p className="text-gray-600 text-sm">{packageDetail.specialInstructions}</p>
                  </div>
                )}

                {/* Special Handling Flags */}
                <div>
                  <p className="font-medium text-gray-700 mb-2">Special Handling</p>
                  <div className="flex gap-2 flex-wrap">
                    {packageDetail.isFragile && <Badge variant="outline">Fragile</Badge>}
                    {packageDetail.isHighValue && <Badge variant="outline">High Value</Badge>}
                    {packageDetail.requiresAdultSignature && <Badge variant="outline">Adult Signature</Badge>}
                    {packageDetail.isRestricted && <Badge variant="outline">Restricted</Badge>}
                    {!packageDetail.isFragile && !packageDetail.isHighValue && !packageDetail.requiresAdultSignature && !packageDetail.isRestricted && (
                      <span className="text-sm text-gray-500">No special handling required</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sender Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Sender Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Sender Name</p>
                    <p className="text-gray-600">{packageDetail.senderName}</p>
                  </div>
                  {packageDetail.senderCompany && (
                    <div>
                      <p className="font-medium text-gray-700">Company</p>
                      <p className="text-gray-600">{packageDetail.senderCompany}</p>
                    </div>
                  )}
                  {packageDetail.trackingNumberInbound && (
                    <div>
                      <p className="font-medium text-gray-700">Inbound Tracking</p>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-600">{packageDetail.trackingNumberInbound}</p>
                        {packageDetail.senderTrackingUrl && (
                          <Link href={packageDetail.senderTrackingUrl} target="_blank">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Customer</p>
                    <p className="text-gray-600">{packageDetail.customerName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Email</p>
                    <p className="text-gray-600">{packageDetail.customerEmail}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Customer ID</p>
                    <Badge variant="outline">{packageDetail.customerId}</Badge>
                  </div>
                </div>

                {packageDetail.customerNotes && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Customer Notes</p>
                    <p className="text-gray-600 text-sm">{packageDetail.customerNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warehouse Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Warehouse Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Warehouse</p>
                    <p className="text-gray-600">{packageDetail.warehouseName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Code</p>
                    <Badge variant="secondary">{packageDetail.warehouseCode}</Badge>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-600">{packageDetail.warehouseCity}, {packageDetail.warehouseCountry}</p>
                  </div>
                </div>

                {packageDetail.warehouseNotes && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Warehouse Notes</p>
                    <p className="text-gray-600 text-sm">{packageDetail.warehouseNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Physical Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Physical Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Actual Weight</p>
                    <p className="text-gray-600">{formatWeight(packageDetail.weightActualKg)}</p>
                  </div>
                  {packageDetail.volumetricWeightKg && (
                    <div>
                      <p className="font-medium text-gray-700">Volumetric Weight</p>
                      <p className="text-gray-600">{formatWeight(packageDetail.volumetricWeightKg)}</p>
                    </div>
                  )}
                </div>
                
                {(packageDetail.lengthCm || packageDetail.widthCm || packageDetail.heightCm) && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Dimensions (L × W × H)</p>
                    <p className="text-gray-600 text-sm">
                      {packageDetail.lengthCm || 'N/A'} × {packageDetail.widthCm || 'N/A'} × {packageDetail.heightCm || 'N/A'} cm
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Value Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Value Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-700">Estimated Value</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(packageDetail.estimatedValue, packageDetail.estimatedValueCurrency)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Currency</p>
                  <Badge variant="outline">{packageDetail.estimatedValueCurrency}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Package Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Current Status</label>
                  <div className="mt-1">
                    {getStatusBadge(packageDetail.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">New Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGE_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status Notes</label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Change Reason</label>
                <Select value={changeReason} onValueChange={setChangeReason}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_update">Manual Update</SelectItem>
                    <SelectItem value="customer_request">Customer Request</SelectItem>
                    <SelectItem value="warehouse_processing">Warehouse Processing</SelectItem>
                    <SelectItem value="issue_resolution">Issue Resolution</SelectItem>
                    <SelectItem value="quality_check">Quality Check</SelectItem>
                    <SelectItem value="system_update">System Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === packageDetail.status}
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Status
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {statusHistory.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.notes && (
                          <p className="text-sm text-gray-900 mb-1">{item.notes}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                          {item.changedByName && (
                            <>
                              <span>•</span>
                              <span>by {item.changedByName}</span>
                            </>
                          )}
                          {item.changeReason && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{item.changeReason.replace('_', ' ')}</span>
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
                  <p className="text-gray-600">No status history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Package Documents
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="capitalize">{doc.documentType.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.fileSizeBytes)}</span>
                            {doc.uploadedByName && (
                              <>
                                <span>•</span>
                                <span>by {doc.uploadedByName}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.isPublic ? (
                          <Badge variant="outline">Public</Badge>
                        ) : (
                          <Badge variant="secondary">Private</Badge>
                        )}
                        <Link href={doc.fileUrl} target="_blank">
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
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No documents uploaded yet</p>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Upload First Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}