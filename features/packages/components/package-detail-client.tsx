// features/packages/components/package-detail-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  ArrowLeft, 
  Edit, 
  Truck, 
  User, 
  MapPin, 
  Weight, 
  DollarSign, 
  Calendar,
  FileText,
  Image,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { formatWeight } from '@/lib/utils';

interface PackageDetail {
  id: string;
  internalId: string;
  trackingNumberInbound: string | null;
  trackingNumberOutbound: string | null;
  senderName: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  description: string | null;
  status: string;
  
  // Physical characteristics
  weightActualKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  volumetricWeightKg: number | null;
  chargeableWeightKg: number | null;
  
  // Value and customs
  estimatedValue: number | null;
  estimatedValueCurrency: string | null;
  customsDeclaration: string | null;
  customsValue: number | null;
  customsValueCurrency: string | null;
  countryOfOrigin: string | null;
  hsCode: string | null;
  
  // Dates
  expectedArrivalDate: string | null;
  receivedAt: string | null;
  readyToShipAt: string | null;
  storageExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  
  warehouse: {
    id: string;
    name: string;
    code: string;
    city: string;
    countryCode: string;
  };
  
  // Notes and instructions
  warehouseNotes: string | null;
  customerNotes: string | null;
  specialInstructions: string | null;
  
  // Package characteristics
  isFragile: boolean;
  isHighValue: boolean;
  requiresAdultSignature: boolean;
  isRestricted: boolean;
}

interface PackageDetailClientProps {
  packageId: string;
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

export function PackageDetailClient({ packageId }: PackageDetailClientProps) {
  const router = useRouter();
  const [packageDetail, setPackageDetail] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPackageDetail();
  }, [packageId]);

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/admin/packages/${packageId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch package details');
      }

      const data = await response.json();
      setPackageDetail(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch package details');
    } finally {
      setLoading(false);
    }
  };

  const formatDimensions = (length: number | null, width: number | null, height: number | null): string => {
    if (!length || !width || !height) return 'N/A';
    return `${length} × ${width} × ${height} cm`;
  };

  const formatCurrency = (amount: number | null, currency: string | null): string => {
    const num = Number(amount);
    return Number.isFinite(num) ? `${num.toFixed(2)} ${currency}` : 'N/A';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading package details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 bg-red-50 p-4 rounded-md">
          {error}
        </div>
        <Button 
          onClick={() => router.back()} 
          variant="outline" 
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!packageDetail) {
    return (
      <div className="text-center py-8">
        <p>Package not found</p>
        <Button 
          onClick={() => router.back()} 
          variant="outline" 
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6" />
              {packageDetail.internalId}
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <StatusBadge status={packageDetail.status} />
              {packageDetail.trackingNumberInbound && (
                <>
                  <span>•</span>
                  <span className="font-mono text-sm">{packageDetail.trackingNumberInbound}</span>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/admin/packages/${packageDetail.id}/edit`}>
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
                <Truck className="mr-2 h-4 w-4" />
                Create Shipment
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Generate Label
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Image className="mr-2 h-4 w-4" />
                View Photos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Internal ID</label>
                    <p className="font-mono">{packageDetail.internalId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={packageDetail.status} />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Inbound Tracking</label>
                    <p className="font-mono text-sm">{packageDetail.trackingNumberInbound || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Outbound Tracking</label>
                    <p className="font-mono text-sm">{packageDetail.trackingNumberOutbound || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p>{packageDetail.description || 'No description provided'}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sender Name</label>
                    <p>{packageDetail.senderName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sender Email</label>
                    <p>{packageDetail.senderEmail || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physical Characteristics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Weight className="h-5 w-5" />
                  Physical Characteristics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Actual Weight</label>
                    <p>{formatWeight(packageDetail.weightActualKg)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chargeable Weight</label>
                    <p>{formatWeight(packageDetail.chargeableWeightKg)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dimensions (L×W×H)</label>
                    <p>{formatDimensions(packageDetail.lengthCm, packageDetail.widthCm, packageDetail.heightCm)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Volumetric Weight</label>
                    <p>{formatWeight(packageDetail.volumetricWeightKg)}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estimated Value</label>
                    <p>{formatCurrency(packageDetail.estimatedValue, packageDetail.estimatedValueCurrency)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customs Value</label>
                    <p>{formatCurrency(packageDetail.customsValue, packageDetail.customsValueCurrency)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country of Origin</label>
                    <p>{packageDetail.countryOfOrigin || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">HS Code</label>
                    <p className="font-mono text-sm">{packageDetail.hsCode || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Package Characteristics */}
          <Card>
            <CardHeader>
              <CardTitle>Package Characteristics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {packageDetail.isFragile && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Fragile
                  </Badge>
                )}
                {packageDetail.isHighValue && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <DollarSign className="mr-1 h-3 w-3" />
                    High Value
                  </Badge>
                )}
                {packageDetail.requiresAdultSignature && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="mr-1 h-3 w-3" />
                    Adult Signature Required
                  </Badge>
                )}
                {packageDetail.isRestricted && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="mr-1 h-3 w-3" />
                    Restricted Item
                  </Badge>
                )}
                {!packageDetail.isFragile && !packageDetail.isHighValue && !packageDetail.requiresAdultSignature && !packageDetail.isRestricted && (
                  <span className="text-gray-500 text-sm">No special characteristics</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dates and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Expected Arrival</label>
                  <p className="text-sm">{formatDate(packageDetail.expectedArrivalDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Received At</label>
                  <p className="text-sm">{formatDate(packageDetail.receivedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ready to Ship</label>
                  <p className="text-sm">{formatDate(packageDetail.readyToShipAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Storage Expires</label>
                  <p className="text-sm">{formatDate(packageDetail.storageExpiresAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="font-medium">{packageDetail.customer?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p>{packageDetail.customer?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p>{packageDetail.customer?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Link href={`/admin/customers/${packageDetail.customer?.id}`}>
                    <Button variant="outline" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      View Customer Profile
                    </Button>
                  </Link>
                </div>
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
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Warehouse</label>
                  <p className="font-medium">{packageDetail.warehouse?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Code</label>
                  <p className="font-mono">{packageDetail.warehouse?.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p>{packageDetail.warehouse?.city}, {packageDetail.warehouse?.countryCode}</p>
                </div>
                <div>
                  <Link href={`/admin/warehouses/${packageDetail.warehouse?.id}`}>
                    <Button variant="outline" size="sm">
                      <MapPin className="mr-2 h-4 w-4" />
                      View Warehouse Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No shipments created for this package yet</p>
                <Button className="mt-4">
                  <Truck className="mr-2 h-4 w-4" />
                  Create Shipment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents & Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents uploaded for this package</p>
                <Button variant="outline" className="mt-4">
                  <Image className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Package created</p>
                    <p className="text-xs text-gray-500">{formatDate(packageDetail.createdAt)}</p>
                  </div>
                </div>
                {packageDetail.receivedAt && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Package received at warehouse</p>
                      <p className="text-xs text-gray-500">{formatDate(packageDetail.receivedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes Section */}
      {(packageDetail.warehouseNotes || packageDetail.customerNotes || packageDetail.specialInstructions) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes & Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {packageDetail.warehouseNotes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Warehouse Notes</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md text-sm">{packageDetail.warehouseNotes}</p>
              </div>
            )}
            {packageDetail.customerNotes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Customer Notes</label>
                <p className="mt-1 p-3 bg-blue-50 rounded-md text-sm">{packageDetail.customerNotes}</p>
              </div>
            )}
            {packageDetail.specialInstructions && (
              <div>
                <label className="text-sm font-medium text-gray-500">Special Instructions</label>
                <p className="mt-1 p-3 bg-yellow-50 rounded-md text-sm">{packageDetail.specialInstructions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}