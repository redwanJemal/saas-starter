// app/dashboard/checkout/[shipmentId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Clock, 
  Truck, 
  Weight, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import StripePaymentForm from '@/components/stripe/StripePaymentForm';

interface CheckoutData {
  shipment: {
    id: string;
    shipmentNumber: string;
    status: string;
    serviceType: string;
    totalWeightKg: number;
    quoteExpiresAt: string;
    canPay?: boolean;
    costs: {
      shippingCost: number;
      insuranceCost: number;
      handlingFee: number;
      storageFee: number;
      totalCost: number;
      currency: string;
    };
    rateBreakdown?: {
      baseRate: number;
      weightCharge: number;
      minChargeApplied: boolean;
      finalAmount: number;
    };
  };
  shippingAddress?: {
    name: string;
    companyName?: string;
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
    companyName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
  };
  clientSecret?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.shipmentId as string;

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shipmentId) {
      fetchCheckoutData();
    }
  }, [shipmentId]);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/shipments/${shipmentId}/checkout`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch checkout data');
      }

      const data = await response.json();
      setCheckoutData(data);
    } catch (error) {
      console.error('Error fetching checkout data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const [success, setSuccess] = useState<string | null>(null);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setSuccess('Payment completed successfully!');
    // Redirect after a brief success message
    setTimeout(() => {
      router.push(`/dashboard/shipments/${shipmentId}?payment=success&pi=${paymentIntentId}`);
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !checkoutData) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Unable to load checkout data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { shipment, shippingAddress, billingAddress } = checkoutData;
  const isQuoteExpired = shipment.quoteExpiresAt ? new Date() > new Date(shipment.quoteExpiresAt) : false;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">
          Complete your payment for shipment {shipment.shipmentNumber}
        </p>
      </div>

      {isQuoteExpired && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quote has expired. Please request a new quote before proceeding.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Shipment Number</span>
                <span>{shipment.shipmentNumber}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Service Type</span>
                <Badge variant="outline">
                  {shipment.serviceType?.charAt(0).toUpperCase() + shipment.serviceType?.slice(1)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Weight</span>
                <span className="flex items-center gap-1">
                  <Weight className="h-4 w-4" />
                  {shipment.totalWeightKg} kg
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Status</span>
                <Badge variant={shipment.status === 'quoted' ? 'default' : 'secondary'}>
                  {shipment.status}
                </Badge>
              </div>

              {shipment.quoteExpiresAt && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Quote Expires</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {format(new Date(shipment.quoteExpiresAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{shippingAddress.name}</p>
                  {shippingAddress.companyName && (
                    <p className="text-sm text-muted-foreground">{shippingAddress.companyName}</p>
                  )}
                  <p>{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                  <p>
                    {shippingAddress.city}
                    {shippingAddress.stateProvince && `, ${shippingAddress.stateProvince}`} {shippingAddress.postalCode}
                  </p>
                  <p className="font-medium">{shippingAddress.countryCode}</p>
                  {shippingAddress.phone && (
                    <p className="text-sm text-muted-foreground">{shippingAddress.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rate Breakdown */}
          {shipment.rateBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Rate Calculation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Rate</span>
                  <span>{shipment.costs.currency} {shipment.rateBreakdown.baseRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight Charge ({shipment.totalWeightKg} kg)</span>
                  <span>{shipment.costs.currency} {shipment.rateBreakdown.weightCharge}</span>
                </div>
                {shipment.rateBreakdown.minChargeApplied && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Minimum charge applied</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipment.costs.currency} {shipment.costs.shippingCost}</span>
                </div>
                
                {shipment.costs.insuranceCost > 0 && (
                  <div className="flex justify-between">
                    <span>Insurance</span>
                    <span>{shipment.costs.currency} {shipment.costs.insuranceCost}</span>
                  </div>
                )}
                
                {shipment.costs.handlingFee > 0 && (
                  <div className="flex justify-between">
                    <span>Handling Fee</span>
                    <span>{shipment.costs.currency} {shipment.costs.handlingFee}</span>
                  </div>
                )}
                
                {shipment.costs.storageFee > 0 && (
                  <div className="flex justify-between">
                    <span>Storage Fee</span>
                    <span>{shipment.costs.currency} {shipment.costs.storageFee}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{shipment.costs.currency} {shipment.costs.totalCost}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {!isQuoteExpired && !success && checkoutData.clientSecret && shipment.canPay && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StripePaymentForm
                  clientSecret={checkoutData.clientSecret}
                  amount={Math.round(shipment.costs.totalCost * 100)}
                  currency={shipment.costs.currency}
                  shipmentId={shipmentId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </CardContent>
            </Card>
          )}

          {success && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}