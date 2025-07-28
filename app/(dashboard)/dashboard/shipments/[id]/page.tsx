// app/(dashboard)/dashboard/shipments/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, MapPin, CreditCard, Clock, Truck, Weight, DollarSign, 
  AlertCircle, CheckCircle, Loader2, ArrowLeft, ExternalLink, 
  Globe, Phone, Calendar, FileText, Download, Copy, RefreshCw,
  Navigation, Box, User
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  trackingNumber?: string;
  carrierCode?: string;
  serviceType: string;
  totalWeightKg: number;
  totalDeclaredValue: number;
  declaredValueCurrency: string;
  totalCost?: number;
  costCurrency?: string;
  quoteExpiresAt?: string;
  paidAt?: string;
  dispatchedAt?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  deliveryInstructions?: string;
  requiresSignature: boolean;
  customsStatus?: string;
  commercialInvoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
  warehouseName: string;
  warehouseCode: string;
  shippingAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
  };
  packages: Array<{
    id: string;
    internalId: string;
    description: string;
    weightActualKg: number;
    estimatedValue: number;
    estimatedValueCurrency: string;
    isFragile: boolean;
  }>;
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shipmentId = params.id as string;
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check for payment success
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      setSuccess('Payment completed successfully! Your shipment will be processed shortly.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (shipmentId) {
      fetchShipment();
    }
  }, [shipmentId]);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/shipments/${shipmentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shipment details');
      }
      
      const data = await response.json();
      setShipment(data.shipment);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      setError('Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote_requested': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'dispatched':
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'delivery_failed':
      case 'returned': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'quote_requested':
      case 'quoted': return Clock;
      case 'paid':
      case 'processing': return Package;
      case 'dispatched':
      case 'in_transit':
      case 'out_for_delivery': return Truck;
      case 'delivered': return CheckCircle;
      case 'delivery_failed':
      case 'returned':
      case 'cancelled': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Shipment not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(shipment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {shipment.shipmentNumber}
            </h1>
            <p className="text-muted-foreground">
              Created {format(new Date(shipment.createdAt), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(shipment.status)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {shipment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
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
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                Shipment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Status:</span>
                <Badge className={getStatusColor(shipment.status)}>
                  {shipment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>

              {shipment.trackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tracking Number:</span>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm">
                      {shipment.trackingNumber}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(shipment.trackingNumber!, 'Tracking number')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {shipment.quoteExpiresAt && shipment.status === 'quoted' && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Quote Expires:</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(shipment.quoteExpiresAt), 'PPP p')}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex gap-2">
                {shipment.status === 'quoted' && 
                 shipment.totalCost && 
                 parseFloat(shipment.totalCost.toString()) > 0 && 
                 (!shipment.quoteExpiresAt || new Date() <= new Date(shipment.quoteExpiresAt)) && (
                  <Button 
                    onClick={() => router.push(`/dashboard/checkout/${shipment.id}`)}
                    className="w-full sm:w-auto"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now - {shipment.costCurrency} {parseFloat(shipment.totalCost.toString()).toFixed(2)}
                  </Button>
                )}
                
                {shipment.status === 'quote_requested' && (
                  <Button variant="outline" onClick={fetchShipment}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check for Quote
                  </Button>
                )}

                {shipment.commercialInvoiceUrl && (
                  <Button variant="outline" asChild>
                    <a href={shipment.commercialInvoiceUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Commercial Invoice
                    </a>
                  </Button>
                )}
                
                {shipment.status === 'quoted' && 
                 shipment.quoteExpiresAt && 
                 new Date() > new Date(shipment.quoteExpiresAt) && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This quote has expired. Please contact support to request a new quote.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Packages ({shipment.packages?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipment.packages && shipment.packages.length > 0 ? shipment.packages.map((pkg) => (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pkg.internalId}</span>
                        {pkg.isFragile && (
                          <Badge variant="destructive" className="text-xs">
                            Fragile
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pkg.weightActualKg}kg
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {pkg.description}
                    </p>
                    <div className="text-sm text-muted-foreground">
                      Value: {formatCurrency(pkg.estimatedValue, pkg.estimatedValueCurrency)}
                    </div>
                  </div>
                )) : <p className="text-muted-foreground text-center py-4">No packages in this shipment</p>}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Instructions */}
          {shipment.deliveryInstructions && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{shipment.deliveryInstructions}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary & Address */}
        <div className="space-y-6">
          {/* Cost Summary */}
          {shipment.totalCost && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(shipment.totalCost, shipment.costCurrency)}</span>
                </div>
                <Separator />
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Service:</span>
                    <span className="capitalize">{shipment.serviceType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Weight:</span>
                    <span>{shipment.totalWeightKg}kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Declared Value:</span>
                    <span>{formatCurrency(shipment.totalDeclaredValue, shipment.declaredValueCurrency)}</span>
                  </div>
                  {shipment.requiresSignature && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <User className="h-3 w-3" />
                      <span>Signature Required</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping Address */}
          {shipment.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-medium">{shipment.shippingAddress.name}</div>
                <div>{shipment.shippingAddress.addressLine1}</div>
                {shipment.shippingAddress.addressLine2 && (
                  <div>{shipment.shippingAddress.addressLine2}</div>
                )}
                <div>
                  {shipment.shippingAddress.city}
                  {shipment.shippingAddress.stateProvince && 
                    `, ${shipment.shippingAddress.stateProvince}`
                  } {shipment.shippingAddress.postalCode}
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {shipment.shippingAddress.countryCode}
                </div>
                {shipment.shippingAddress.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {shipment.shippingAddress.phone}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Warehouse Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Origin Warehouse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-medium">{shipment.warehouseName}</div>
              <div className="text-muted-foreground">
                Code: {shipment.warehouseCode}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(new Date(shipment.createdAt), 'MMM d, HH:mm')}</span>
                </div>
                
                {shipment.paidAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paid:</span>
                    <span>{format(new Date(shipment.paidAt), 'MMM d, HH:mm')}</span>
                  </div>
                )}
                
                {shipment.dispatchedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dispatched:</span>
                    <span>{format(new Date(shipment.dispatchedAt), 'MMM d, HH:mm')}</span>
                  </div>
                )}
                
                {shipment.estimatedDeliveryDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Est. Delivery:</span>
                    <span>{format(new Date(shipment.estimatedDeliveryDate), 'MMM d')}</span>
                  </div>
                )}
                
                {shipment.deliveredAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivered:</span>
                    <span>{format(new Date(shipment.deliveredAt), 'MMM d, HH:mm')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customs Status */}
          {shipment.customsStatus && shipment.customsStatus !== 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Customs Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={shipment.customsStatus === 'cleared' ? 'default' : 'outline'}
                  className={
                    shipment.customsStatus === 'cleared' 
                      ? 'bg-green-100 text-green-800' 
                      : 'text-orange-600 border-orange-200'
                  }
                >
                  {shipment.customsStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}