'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  Search, 
  User, 
  Scale, 
  DollarSign, 
  Loader2, 
  Save,
  CheckCircle,
  AlertCircle,
  Truck
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  suiteCode: string;
  warehouseId: string;
  warehouseName: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  acceptsNewPackages: boolean;
}

interface PackageFormData {
  warehouseId: string;
  customerProfileId: string;
  suiteCodeCaptured: string;
  trackingNumberInbound: string;
  senderName: string;
  senderCompany: string;
  senderTrackingUrl: string;
  description: string;
  estimatedValue: number;
  estimatedValueCurrency: string;
  weightActualKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  warehouseNotes: string;
  specialInstructions: string;
  isFragile: boolean;
  isHighValue: boolean;
  requiresAdultSignature: boolean;
  isRestricted: boolean;
  expectedArrivalDate: string;
}

const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'SGD', name: 'Singapore Dollar' },
];

export default function IncomingPackageForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [suiteCodeSearch, setSuiteCodeSearch] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  
  const [formData, setFormData] = useState<PackageFormData>({
    warehouseId: '',
    customerProfileId: '',
    suiteCodeCaptured: '',
    trackingNumberInbound: '',
    senderName: '',
    senderCompany: '',
    senderTrackingUrl: '',
    description: '',
    estimatedValue: 0,
    estimatedValueCurrency: 'USD',
    weightActualKg: 0,
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
    warehouseNotes: '',
    specialInstructions: '',
    isFragile: false,
    isHighValue: false,
    requiresAdultSignature: false,
    isRestricted: false,
    expectedArrivalDate: '',
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (suiteCodeSearch.length >= 2) {
      searchCustomers();
    } else {
      setCustomerSearchResults([]);
    }
  }, [suiteCodeSearch]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/admin/warehouses?limit=100');
      const data = await response.json();
      setWarehouses(data.warehouses.filter((w: Warehouse) => w.acceptsNewPackages));
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setWarehousesLoading(false);
    }
  };

  const searchCustomers = async () => {
    if (!suiteCodeSearch.trim()) return;
    
    setCustomerLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(suiteCodeSearch)}`);
      const data = await response.json();
      setCustomerSearchResults(data.customers || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerProfileId: customer.id,
      suiteCodeCaptured: customer.suiteCode,
      warehouseId: customer.warehouseId,
    }));
    setSuiteCodeSearch(customer.suiteCode);
    setCustomerSearchResults([]);
  };

  const handleInputChange = (field: keyof PackageFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateInternalId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PKG-${timestamp}${random}`;
  };

  const calculateVolumetricWeight = () => {
    const { lengthCm, widthCm, heightCm } = formData;
    if (lengthCm && widthCm && heightCm) {
      // Standard volumetric weight calculation (L x W x H / 5000)
      return (lengthCm * widthCm * heightCm) / 5000;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedCustomer) {
      setError('Please select a customer');
      setLoading(false);
      return;
    }

    try {
      const volumetricWeightKg = calculateVolumetricWeight();
      const internalId = generateInternalId();

      const packageData = {
        ...formData,
        internalId,
        volumetricWeightKg,
        status: 'received',
        receivedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register package');
      }

      const newPackage = await response.json();
      setSuccess(`Package ${newPackage.internalId} registered successfully!`);
      
      // Reset form or redirect
      setTimeout(() => {
        router.push(`/admin/packages/${newPackage.id}`);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/packages">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register Incoming Package</h1>
          <p className="text-gray-600">Process a new package received at the warehouse</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="suiteCode">
                Suite Code <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="suiteCode"
                  value={suiteCodeSearch}
                  onChange={(e) => setSuiteCodeSearch(e.target.value)}
                  placeholder="Enter suite code or customer ID..."
                  className="pr-10"
                  required
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Search by suite code, customer ID, or name
              </p>
            </div>

            {/* Customer Search Results */}
            {customerLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching customers...
              </div>
            )}

            {customerSearchResults.length > 0 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <div className="p-2 bg-gray-50 border-b">
                  <p className="text-sm font-medium">Select Customer:</p>
                </div>
                {customerSearchResults.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{customer.customerId}</Badge>
                          <Badge variant="secondary">{customer.suiteCode}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{customer.warehouseName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Customer */}
            {selectedCustomer && (
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-800">Customer Selected</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                    <p><strong>Email:</strong> {selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p><strong>Customer ID:</strong> {selectedCustomer.customerId}</p>
                    <p><strong>Suite Code:</strong> {selectedCustomer.suiteCode}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Package Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={formData.trackingNumberInbound}
                  onChange={(e) => handleInputChange('trackingNumberInbound', e.target.value)}
                  placeholder="e.g. 1Z999AA1234567890"
                />
              </div>
              <div>
                <Label htmlFor="expectedArrival">Expected Arrival Date</Label>
                <Input
                  id="expectedArrival"
                  type="date"
                  value={formData.expectedArrivalDate}
                  onChange={(e) => handleInputChange('expectedArrivalDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senderName">
                  Sender Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="senderName"
                  value={formData.senderName}
                  onChange={(e) => handleInputChange('senderName', e.target.value)}
                  placeholder="e.g. Amazon"
                  required
                />
              </div>
              <div>
                <Label htmlFor="senderCompany">Sender Company</Label>
                <Input
                  id="senderCompany"
                  value={formData.senderCompany}
                  onChange={(e) => handleInputChange('senderCompany', e.target.value)}
                  placeholder="e.g. Amazon.com LLC"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="senderTrackingUrl">Sender Tracking URL</Label>
              <Input
                id="senderTrackingUrl"
                type="url"
                value={formData.senderTrackingUrl}
                onChange={(e) => handleInputChange('senderTrackingUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="description">
                Package Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the package contents..."
                rows={3}
                required
              />
            </div>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">
                  Weight (kg) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.weightActualKg}
                  onChange={(e) => handleInputChange('weightActualKg', parseFloat(e.target.value) || 0)}
                  placeholder="0.000"
                  required
                />
              </div>
              <div>
                <Label>Volumetric Weight (kg)</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {calculateVolumetricWeight().toFixed(3)} kg
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Calculated from dimensions (L × W × H ÷ 5000)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.lengthCm}
                  onChange={(e) => handleInputChange('lengthCm', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.widthCm}
                  onChange={(e) => handleInputChange('widthCm', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.heightCm}
                  onChange={(e) => handleInputChange('heightCm', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Value & Special Handling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Value & Special Handling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Estimated Value</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimatedValue}
                  onChange={(e) => handleInputChange('estimatedValue', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.estimatedValueCurrency} 
                  onValueChange={(value) => handleInputChange('estimatedValueCurrency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Special Handling Flags */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Special Handling Requirements:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fragile"
                    checked={formData.isFragile}
                    onChange={(e) => handleInputChange('isFragile', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="fragile">Fragile</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="highValue"
                    checked={formData.isHighValue}
                    onChange={(e) => handleInputChange('isHighValue', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="highValue">High Value</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="adultSignature"
                    checked={formData.requiresAdultSignature}
                    onChange={(e) => handleInputChange('requiresAdultSignature', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="adultSignature">Adult Signature</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="restricted"
                    checked={formData.isRestricted}
                    onChange={(e) => handleInputChange('isRestricted', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="restricted">Restricted</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="warehouseNotes">Warehouse Notes</Label>
              <Textarea
                id="warehouseNotes"
                value={formData.warehouseNotes}
                onChange={(e) => handleInputChange('warehouseNotes', e.target.value)}
                placeholder="Internal notes for warehouse staff..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Special handling or delivery instructions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/packages">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !selectedCustomer}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Register Package
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}