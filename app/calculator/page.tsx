// app/calculator/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calculator, Package, Truck, MapPin, Weight, DollarSign, AlertCircle, Info, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

interface Country {
  code: string;
  name: string;
  region?: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  city: string;
  addressLine1: string;
  postalCode: string;
}

interface ServiceType {
  type: 'economy' | 'standard' | 'express';
  name: string;
  description: string;
  estimatedDays: string;
}

interface RateCalculationResult {
  success: boolean;
  rate?: {
    baseRate: number;
    perKgRate: number;
    weightCharge: number;
    totalShippingCost: number;
    minCharge: number;
    maxWeightKg?: number;
    currencyCode: string;
    zoneName: string;
    warehouseName: string;
    estimatedDays: string;
  };
  breakdown?: {
    baseRate: number;
    weightCharge: number;
    total: number;
  };
  error?: string;
}

const serviceTypes: ServiceType[] = [
  {
    type: 'economy',
    name: 'Economy',
    description: 'Cost-effective shipping',
    estimatedDays: '7-14 days'
  },
  {
    type: 'standard',
    name: 'Standard',
    description: 'Balanced speed and cost',
    estimatedDays: '5-10 days'
  },
  {
    type: 'express',
    name: 'Express',
    description: 'Fast delivery',
    estimatedDays: '2-5 days'
  }
];

export default function ShippingCalculatorPage() {
  // State for form inputs
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('standard');
  const [weight, setWeight] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');

  // State for data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RateCalculationResult | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setDataLoading(true);
      const [warehousesRes, countriesRes] = await Promise.all([
        fetch('/api/public/warehouses'),
        fetch('/api/public/countries')
      ]);

      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData.warehouses || []);
      }

      if (countriesRes.ok) {
        const countriesData = await countriesRes.json();
        setCountries(countriesData.countries || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load calculator data');
    } finally {
      setDataLoading(false);
    }
  };

  const calculateChargeableWeight = () => {
    if (!weight) return 0;
    
    const actualWeight = parseFloat(weight);
    
    // Calculate volumetric weight if dimensions are provided
    if (length && width && height) {
      const l = parseFloat(length);
      const w = parseFloat(width);
      const h = parseFloat(height);
      const volumetricWeight = (l * w * h) / 5000; // Standard volumetric divisor
      return Math.max(actualWeight, volumetricWeight);
    }
    
    return actualWeight;
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Validation
      if (!selectedWarehouse || !selectedCountry || !weight) {
        setError('Please fill in all required fields');
        return;
      }

      const chargeableWeight = calculateChargeableWeight();
      if (chargeableWeight <= 0) {
        setError('Weight must be greater than 0');
        return;
      }

      // Calculate shipping rate
      const response = await fetch('/api/public/calculate-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          destinationCountry: selectedCountry,
          serviceType: selectedService,
          totalChargeableWeightKg: chargeableWeight,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate shipping rate');
      }

      setResult(data);
    } catch (error) {
      console.error('Error calculating shipping:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate shipping cost');
    } finally {
      setLoading(false);
    }
  };

  const selectedWarehouseData = warehouses.find(w => w.id === selectedWarehouse);
  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const selectedServiceData = serviceTypes.find(s => s.type === selectedService);

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Package className="h-8 w-8 text-orange-500" />
                <span className="ml-2 text-xl font-bold text-gray-900">UKtoEast</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <Home className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Cost Calculator</h1>
          <p className="text-lg text-gray-600">
            Calculate shipping costs from our warehouses to your destination
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warehouse Selection */}
              <div>
                <Label htmlFor="warehouse">From Warehouse *</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {warehouse.name} ({warehouse.code}) - {warehouse.city}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWarehouseData && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedWarehouseData.addressLine1}, {selectedWarehouseData.city}, {selectedWarehouseData.postalCode}
                  </p>
                )}
              </div>

              {/* Destination Country */}
              <div>
                <Label htmlFor="country">To Country *</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} {country.region ? `(${country.region})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Type */}
              <div>
                <Label htmlFor="service">Service Type</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((service) => (
                      <SelectItem key={service.type} value={service.type}>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500">{service.description} - {service.estimatedDays}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Package Details */}
              <div>
                <Label className="text-base font-medium flex items-center gap-2 mb-4">
                  <Weight className="h-4 w-4" />
                  Package Details
                </Label>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g., 2.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="length">Length (cm)</Label>
                      <Input
                        id="length"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="L"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Width (cm)</Label>
                      <Input
                        id="width"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="W"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="H"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                  </div>

                  {length && width && height && weight && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Chargeable weight: {calculateChargeableWeight().toFixed(2)} kg
                        {calculateChargeableWeight() > parseFloat(weight) && (
                          <span className="text-orange-600"> (Volumetric weight applies)</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Calculate Button */}
              <Button 
                onClick={handleCalculate} 
                disabled={loading || !selectedWarehouse || !selectedCountry || !weight}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Shipping Cost
                  </>
                )}
              </Button>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {result && result.success && result.rate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Shipping Quote
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Route Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">From:</div>
                        <div className="font-medium">{result.rate.warehouseName}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <div className="text-gray-600">To:</div>
                        <div className="font-medium">{selectedCountryData?.name}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <div className="text-gray-600">Zone:</div>
                        <div className="font-medium">{result.rate.zoneName}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <div className="text-gray-600">Service:</div>
                        <div className="font-medium">{selectedServiceData?.name}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <div className="text-gray-600">Est. Delivery:</div>
                        <div className="font-medium">{selectedServiceData?.estimatedDays}</div>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Rate:</span>
                        <span>{result.rate.currencyCode} {result.rate.baseRate.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight Charge ({calculateChargeableWeight().toFixed(2)} kg):</span>
                        <span>{result.rate.currencyCode} {result.rate.weightCharge.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Shipping Cost:</span>
                        <span className="text-orange-600">
                          {result.rate.currencyCode} {result.rate.totalShippingCost.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This is an estimate for shipping only. Additional fees may apply for customs, insurance, or special handling.
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="pt-4">
                      <Link href="/sign-up">
                        <Button className="w-full" size="lg">
                          Get Started - Sign Up Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {result && !result.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.error || 'Unable to calculate shipping cost for this route'}
                </AlertDescription>
              </Alert>
            )}

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 rounded-full p-2 mt-1">
                    <span className="text-orange-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Get Your Address</h4>
                    <p className="text-sm text-gray-600">Sign up and receive your personal shipping address at our warehouse</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 rounded-full p-2 mt-1">
                    <span className="text-orange-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Shop Online</h4>
                    <p className="text-sm text-gray-600">Shop from any store and ship to your warehouse address</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 rounded-full p-2 mt-1">
                    <span className="text-orange-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">We Forward</h4>
                    <p className="text-sm text-gray-600">We receive, process, and forward your packages worldwide</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}