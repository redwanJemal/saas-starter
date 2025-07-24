'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Warehouse, MapPin, Clock, DollarSign, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

interface WarehouseFormData {
  name: string;
  code: string;
  description?: string;
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
}

const COUNTRY_OPTIONS = [
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
];

export default function CreateWarehousePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    code: '',
    description: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    countryCode: 'AE',
    phone: '',
    email: '',
    timezone: 'Asia/Dubai',
    currencyCode: 'AED',
    taxTreatment: 'standard',
    storageFreeDays: 30,
    storageFeePerDay: 1.00,
    maxPackageWeightKg: 30.00,
    maxPackageValue: 10000.00,
    acceptsNewPackages: true,
  });

  const handleInputChange = (field: keyof WarehouseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-set currency when country changes
    if (field === 'countryCode') {
      const country = COUNTRY_OPTIONS.find(c => c.code === value);
      if (country) {
        setFormData(prev => ({ ...prev, currencyCode: country.currency }));
      }
    }
  };

  const generateCode = () => {
    const cityCode = formData.city.slice(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    handleInputChange('code', `${cityCode}${randomNum}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create warehouse');
      }

      const warehouse = await response.json();
      router.push(`/admin/warehouses/${warehouse.id}`);
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
        <Link href="/admin/warehouses">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Warehouses
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Warehouse</h1>
          <p className="text-gray-600">Add a new warehouse location to your network</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">
                  Warehouse Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Dubai Main Warehouse"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">
                  Warehouse Code <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="e.g. DXB01"
                    maxLength={10}
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Unique identifier for the warehouse</p>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                placeholder="Optional description of the warehouse..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="addressLine1">
                Address Line 1 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                placeholder="Street address"
                required
              />
            </div>
            <div>
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stateProvince">State/Province</Label>
                <Input
                  id="stateProvince"
                  value={formData.stateProvince}
                  onChange={(e) => handleInputChange('stateProvince', e.target.value)}
                  placeholder="State or Province"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">
                  Postal Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="Postal code"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="countryCode">
                Country <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.countryCode} onValueChange={(value) => handleInputChange('countryCode', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+971 4 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="warehouse@company.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operational Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currencyCode">Currency</Label>
                <Select value={formData.currencyCode} onValueChange={(value) => handleInputChange('currencyCode', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="taxTreatment">Tax Treatment</Label>
              <Select value={formData.taxTreatment} onValueChange={(value) => handleInputChange('taxTreatment', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Tax</SelectItem>
                  <SelectItem value="exempt">Tax Exempt</SelectItem>
                  <SelectItem value="zero_rated">Zero Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Business Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Business Rules & Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storageFreeDays">Free Storage Days</Label>
                <Input
                  id="storageFreeDays"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.storageFreeDays}
                  onChange={(e) => handleInputChange('storageFreeDays', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-600 mt-1">Days before storage fees apply</p>
              </div>
              <div>
                <Label htmlFor="storageFeePerDay">Storage Fee Per Day ({formData.currencyCode})</Label>
                <Input
                  id="storageFeePerDay"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.storageFeePerDay}
                  onChange={(e) => handleInputChange('storageFeePerDay', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxPackageWeightKg">Max Package Weight (kg)</Label>
                <Input
                  id="maxPackageWeightKg"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.maxPackageWeightKg}
                  onChange={(e) => handleInputChange('maxPackageWeightKg', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="maxPackageValue">Max Package Value ({formData.currencyCode})</Label>
                <Input
                  id="maxPackageValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxPackageValue}
                  onChange={(e) => handleInputChange('maxPackageValue', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptsNewPackages"
                checked={formData.acceptsNewPackages}
                onChange={(e) => handleInputChange('acceptsNewPackages', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="acceptsNewPackages">Accept New Packages</Label>
              <Badge variant={formData.acceptsNewPackages ? "default" : "secondary"}>
                {formData.acceptsNewPackages ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/warehouses">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Warehouse
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}