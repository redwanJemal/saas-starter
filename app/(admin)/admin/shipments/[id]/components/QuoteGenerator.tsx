// app/(admin)/admin/shipments/[id]/components/QuoteGenerator.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calculator, DollarSign, Package, Truck, AlertCircle, CheckCircle } from 'lucide-react';

interface QuoteGeneratorProps {
  shipmentId: string;
  currentStatus: string;
  onQuoteGenerated: () => void;
}

interface CostBreakdown {
  shipping: number;
  insurance: number;
  handling: number;
  storage: number;
  total: number;
  currency: string;
}

interface AvailableService {
  serviceType: string;
  rate: {
    totalShippingCost: number;
    baseRate: number;
    weightCharge: number;
    currencyCode: string;
    zoneName: string;
    breakdown: {
      baseRate: number;
      weightCharge: number;
      minChargeApplied: boolean;
      finalAmount: number;
      chargeableWeightKg: number;
    };
  };
}

export default function QuoteGenerator({ shipmentId, currentStatus, onQuoteGenerated }: QuoteGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [serviceType, setServiceType] = useState<'standard' | 'express' | 'economy'>('standard');
  const [carrierCode, setCarrierCode] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [insuranceCost, setInsuranceCost] = useState('0');
  const [handlingFee, setHandlingFee] = useState('0');
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState('');
  const [notes, setNotes] = useState('');
  
  // Rate calculation results
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [selectedService, setSelectedService] = useState<AvailableService | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);

  // Only show if shipment is in quote_requested status
  if (currentStatus !== 'quote_requested') {
    return null;
  }

  const fetchAvailableServices = async () => {
    try {
      setLoadingServices(true);
      setError('');
      
      const response = await fetch(`/api/admin/shipments/${shipmentId}/quote`);
      if (!response.ok) {
        throw new Error('Failed to fetch available services');
      }
      
      const data = await response.json();
      setAvailableServices(data.availableServices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceSelect = (service: AvailableService) => {
    setSelectedService(service);
    setServiceType(service.serviceType as 'standard' | 'express' | 'economy');
    setShippingCost(service.rate.totalShippingCost.toString());
    
    // Set reasonable defaults for carrier based on service type
    const carriers = {
      standard: { code: 'DHL-STD', name: 'DHL Standard' },
      express: { code: 'DHL-EXP', name: 'DHL Express' },
      economy: { code: 'DHL-ECO', name: 'DHL Economy' },
    };
    
    const carrier = carriers[service.serviceType as keyof typeof carriers];
    setCarrierCode(carrier.code);
    setCarrierName(carrier.name);
    
    // Estimate delivery days based on service type
    const deliveryDays = {
      economy: '7-10',
      standard: '5-7', 
      express: '2-3',
    };
    setEstimatedDeliveryDays(deliveryDays[service.serviceType as keyof typeof deliveryDays]);
  };

  const generateQuote = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate required fields for manual quotes
      if (!autoCalculate) {
        if (!carrierCode || !carrierName || !shippingCost) {
          setError('Carrier code, carrier name, and shipping cost are required');
          return;
        }
      }

      const requestBody = {
        autoCalculateRates: autoCalculate,
        serviceType,
        carrierCode: carrierCode || undefined,
        carrierName: carrierName || undefined,
        trackingNumber: trackingNumber || undefined,
        shippingCost: autoCalculate ? undefined : parseFloat(shippingCost),
        insuranceCost: parseFloat(insuranceCost),
        handlingFee: parseFloat(handlingFee),
        estimatedDeliveryDays: estimatedDeliveryDays ? parseInt(estimatedDeliveryDays) : undefined,
        notes,
      };

      const response = await fetch(`/api/admin/shipments/${shipmentId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quote');
      }

      const data = await response.json();
      setCostBreakdown(data.shipment.costBreakdown);
      setSuccess('Quote generated successfully! Customer can now proceed to payment.');
      onQuoteGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Generate Quote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-calculate toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-calculate rates</Label>
            <div className="text-sm text-muted-foreground">
              Use system rate calculation or enter manual rates
            </div>
          </div>
          <Switch
            checked={autoCalculate}
            onCheckedChange={setAutoCalculate}
          />
        </div>

        {/* Auto-calculate section */}
        {autoCalculate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Available Services</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAvailableServices}
                disabled={loadingServices}
              >
                {loadingServices ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Load Services'
                )}
              </Button>
            </div>

            {availableServices.length > 0 && (
              <div className="grid gap-3">
                {availableServices.map((service, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedService?.serviceType === service.serviceType
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize">{service.serviceType}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.rate.zoneName} • {service.rate.breakdown.chargeableWeightKg}kg
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${service.rate.totalShippingCost.toFixed(2)} {service.rate.currencyCode}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Base: ${service.rate.baseRate.toFixed(2)} + Weight: ${service.rate.weightCharge.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual entry section */}
        {!autoCalculate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrierCode">Carrier Code *</Label>
              <Input
                id="carrierCode"
                value={carrierCode}
                onChange={(e) => setCarrierCode(e.target.value)}
                placeholder="e.g., DHL-STD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrierName">Carrier Name *</Label>
              <Input
                id="carrierName"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="e.g., DHL Standard"
              />
            </div>
          </div>
        )}

        {/* Service type */}
        <div className="space-y-2">
          <Label htmlFor="serviceType">Service Type</Label>
          <Select value={serviceType} onValueChange={(value: 'standard' | 'express' | 'economy') => setServiceType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="express">Express</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cost breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shippingCost">
              Shipping Cost * {autoCalculate && '(Auto-calculated)'}
            </Label>
            <Input
              id="shippingCost"
              type="number"
              step="0.01"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              disabled={autoCalculate}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceCost">Insurance Cost</Label>
            <Input
              id="insuranceCost"
              type="number"
              step="0.01"
              value={insuranceCost}
              onChange={(e) => setInsuranceCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="handlingFee">Handling Fee</Label>
            <Input
              id="handlingFee"
              type="number"
              step="0.01"
              value={handlingFee}
              onChange={(e) => setHandlingFee(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Additional details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking Number (Optional)</Label>
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedDeliveryDays">Estimated Delivery (Days)</Label>
            <Input
              id="estimatedDeliveryDays"
              value={estimatedDeliveryDays}
              onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
              placeholder="e.g., 5-7"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any internal notes about this quote..."
            rows={3}
          />
        </div>

        {/* Error/Success messages */}
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

        {/* Cost breakdown display */}
        {costBreakdown && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Quote Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Shipping Cost:</span>
                  <span>${costBreakdown.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Insurance:</span>
                  <span>${costBreakdown.insurance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Handling Fee:</span>
                  <span>${costBreakdown.handling.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Fee:</span>
                  <span>${costBreakdown.storage.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Cost:</span>
                    <span>${costBreakdown.total.toFixed(2)} {costBreakdown.currency}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate quote button */}
        <Button
          onClick={generateQuote}
          disabled={loading || (autoCalculate && !selectedService) || (!autoCalculate && (!carrierCode || !carrierName || !shippingCost))}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Quote...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Generate Quote
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}