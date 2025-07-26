// app/(admin)/admin/shipments/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Truck, 
  User, 
  MapPin, 
  Package as PackageIcon, 
  Calendar, 
  DollarSign, 
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ShipmentDetail {
  id: string;
  shipmentNumber: string;
  status: string;
  serviceType: string;
  totalWeightKg: number;
  totalDeclaredValue: number;
  declaredValueCurrency: string;
  shippingCost: number;
  insuranceCost: number;
  handlingFee: number;
  storageFee: number;
  totalCost: number;
  costCurrency: string;
  requiresSignature: boolean;
  deliveryInstructions: string | null;
  trackingNumber: string | null;
  carrierName: string | null;
  dispatchedAt: string | null;
  estimatedDeliveryDate: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Customer info
  customerName: string;
  customerEmail: string;
  customerId: string;
  
  // Addresses
  shippingAddress: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
  };
  
  billingAddress: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
  };
  
  // Warehouse
  warehouse: {
    name: string;
    code: string;
    city: string;
    countryCode: string;
  };
  
  // Packages
  packages: Array<{
    id: string;
    internalId: string;
    trackingNumberInbound: string | null;
    description: string | null;
    weightActualKg: number;
    chargeableWeightKg: number;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    status: string;
  }>;
}

interface StatusUpdateRequest {
  status: string;
  notes?: string;
  trackingNumber?: string;
}

const SHIPMENT_STATUSES = [
  { value: 'quote_requested', label: 'Quote Requested', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'quoted', label: 'Quoted', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'processing', label: 'Processing', color: 'bg-orange-100 text-orange-800' },
  { value: 'dispatched', label: 'Dispatched', color: 'bg-purple-100 text-purple-800' },
  { value: 'in_transit', label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'delivery_failed', label: 'Delivery Failed', color: 'bg-red-100 text-red-800' },
  { value: 'returned', label: 'Returned', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
];

export default function AdminShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;
  
  const [shipmentDetail, setShipmentDetail] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  useEffect(() => {
    fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/shipments/${shipmentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shipment details');
      }
      const data = await response.json();
      setShipmentDetail(data.shipment);
      setNewStatus(data.shipment.status);
      setTrackingNumber(data.shipment.trackingNumber || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!shipmentDetail || !newStatus) return;

    try {
      setUpdating(true);
      setError('');
      
      const updateData: StatusUpdateRequest = {
        status: newStatus,
        notes: statusNotes,
        ...(trackingNumber && { trackingNumber })
      };

      const response = await fetch(`/api/admin/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setSuccess('Shipment status updated successfully');
      setShowStatusUpdate(false);
      setStatusNotes('');
      await fetchShipmentDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return SHIPMENT_STATUSES.find(s => s.value === status) || 
           { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const formatCurrency = (amount: number, currency: string | null = 'USD') => {
    // Use USD as default if currency is null or undefined
    const currencyCode = currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  
  const formatWeight = (weight: unknown): string => {
    const num = Number(weight);
    return Number.isFinite(num) ? `${num.toFixed(1)} kg` : 'N/A';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !shipmentDetail) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipment Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/admin/shipments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(shipmentDetail?.status || '');

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/admin/shipments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shipments
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Shipment Details</h1>
            <p className="text-gray-600">{shipmentDetail?.shipmentNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => setShowStatusUpdate(!showStatusUpdate)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Update Status
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Status Update Panel */}
      {showStatusUpdate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Update Shipment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <input
                  id="trackingNumber"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tracking number"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="statusNotes">Notes</Label>
              <Textarea
                id="statusNotes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleStatusUpdate} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-700">Shipment Number</p>
                <p className="font-mono">{shipmentDetail?.shipmentNumber}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Service Type</p>
                <p className="capitalize">{shipmentDetail?.serviceType}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Total Weight</p>
                <p>{formatWeight(shipmentDetail?.totalWeightKg || 0)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Tracking Number</p>
                <p className="font-mono">{shipmentDetail?.trackingNumber || 'Not assigned'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Carrier</p>
                <p>{shipmentDetail?.carrierName || 'Not assigned'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Created</p>
                <p>{formatDate(shipmentDetail?.createdAt || '')}</p>
              </div>
            </div>
            
            {shipmentDetail?.deliveryInstructions && (
              <div>
                <p className="font-medium text-gray-700 mb-2">Delivery Instructions</p>
                <p className="text-sm text-gray-600">{shipmentDetail.deliveryInstructions}</p>
              </div>
            )}
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
            <div className="text-sm">
              <p className="font-medium text-gray-700">Customer</p>
              <p className="font-medium">{shipmentDetail?.customerName}</p>
              <p className="text-gray-600">{shipmentDetail?.customerEmail}</p>
              <p className="text-xs text-gray-500">ID: {shipmentDetail?.customerId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-700">Shipping Cost</p>
                <p>{formatCurrency(shipmentDetail?.shippingCost || 0, shipmentDetail?.costCurrency)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Insurance Cost</p>
                <p>{formatCurrency(shipmentDetail?.insuranceCost || 0, shipmentDetail?.costCurrency)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Handling Fee</p>
                <p>{formatCurrency(shipmentDetail?.handlingFee || 0, shipmentDetail?.costCurrency)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Storage Fee</p>
                <p>{formatCurrency(shipmentDetail?.storageFee || 0, shipmentDetail?.costCurrency)}</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-medium">
              <span>Total Cost</span>
              <span className="text-lg">
                {formatCurrency(shipmentDetail?.totalCost || 0, shipmentDetail?.costCurrency)}
              </span>
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
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-700">Warehouse</p>
              <p className="font-medium">{shipmentDetail?.warehouse?.name}</p>
              <p className="text-gray-600">{shipmentDetail?.warehouse?.code}</p>
              <p className="text-xs text-gray-500">
                {shipmentDetail?.warehouse?.city}, {shipmentDetail?.warehouse?.countryCode}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{shipmentDetail?.shippingAddress?.name}</p>
              {shipmentDetail?.shippingAddress?.company && (
                <p className="text-gray-600">{shipmentDetail.shippingAddress.company}</p>
              )}
              <p>{shipmentDetail?.shippingAddress?.street1}</p>
              {shipmentDetail?.shippingAddress?.street2 && (
                <p>{shipmentDetail.shippingAddress.street2}</p>
              )}
              <p>
                {shipmentDetail?.shippingAddress?.city}, {shipmentDetail?.shippingAddress?.stateProvince} {shipmentDetail?.shippingAddress?.postalCode}
              </p>
              <p>{shipmentDetail?.shippingAddress?.countryCode}</p>
              {shipmentDetail?.shippingAddress?.phone && (
                <p className="text-gray-600">{shipmentDetail.shippingAddress.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{shipmentDetail?.billingAddress?.name}</p>
              {shipmentDetail?.billingAddress?.company && (
                <p className="text-gray-600">{shipmentDetail.billingAddress.company}</p>
              )}
              <p>{shipmentDetail?.billingAddress?.street1}</p>
              {shipmentDetail?.billingAddress?.street2 && (
                <p>{shipmentDetail.billingAddress.street2}</p>
              )}
              <p>
                {shipmentDetail?.billingAddress?.city}, {shipmentDetail?.billingAddress?.stateProvince} {shipmentDetail?.billingAddress?.postalCode}
              </p>
              <p>{shipmentDetail?.billingAddress?.countryCode}</p>
              {shipmentDetail?.billingAddress?.phone && (
                <p className="text-gray-600">{shipmentDetail.billingAddress.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Packages ({shipmentDetail?.packages?.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipmentDetail?.packages?.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/admin/packages/${pkg.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium font-mono text-sm">{pkg.internalId}</p>
                    <p className="text-sm text-gray-600">{pkg.description || 'No description'}</p>
                    {pkg.trackingNumberInbound && (
                      <p className="text-xs text-gray-500 font-mono">
                        Inbound: {pkg.trackingNumberInbound}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {pkg.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Actual Weight:</span>
                    <p>{formatWeight(pkg.weightActualKg)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Chargeable Weight:</span>
                    <p>{formatWeight(pkg.chargeableWeightKg)}</p>
                  </div>
                  {(pkg.lengthCm || pkg.widthCm || pkg.heightCm) && (
                    <div>
                      <span className="font-medium">Dimensions:</span>
                      <p>{pkg.lengthCm || 0} × {pkg.widthCm || 0} × {pkg.heightCm || 0} cm</p>
                    </div>
                  )}
                  <div>
                    <Button variant="ghost" size="sm" className="text-xs h-6">
                      View Details →
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {(!shipmentDetail?.packages || shipmentDetail.packages.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <PackageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No packages in this shipment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline/Status History would go here */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Status history will be displayed here</p>
            <p className="text-sm">Track all status changes and updates</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}