// features/settings/components/country-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCreateCountry, useUpdateCountry } from '@/features/settings/hooks/use-settings-query';
import { Country, CountryFormData, UpdateCountryData } from '@/features/settings/types/settings.types';
import { toast } from 'sonner';

interface CountryFormProps {
  country?: Country;
  mode: 'create' | 'edit';
}

const REGIONS = [
  'Africa',
  'Americas',
  'Asia',
  'Europe',
  'Oceania',
];

const CUSTOMS_FORM_TYPES = [
  'CN22',
  'CN23',
  'Commercial Invoice',
  'Other',
];

export function CountryForm({ country, mode }: CountryFormProps) {
  const router = useRouter();
  const createCountryMutation = useCreateCountry();
  const updateCountryMutation = useUpdateCountry();

  const [formData, setFormData] = useState<CountryFormData>({
    code: country?.code || '',
    name: country?.name || '',
    region: country?.region || '',
    subregion: country?.subregion || '',
    isActive: country?.isActive ?? true,
    isShippingEnabled: country?.isShippingEnabled ?? true,
    requiresPostalCode: country?.requiresPostalCode ?? false,
    requiresStateProvince: country?.requiresStateProvince ?? false,
    euMember: country?.euMember ?? false,
    customsFormType: country?.customsFormType || '',
    flagEmoji: country?.flagEmoji || '',
    phonePrefix: country?.phonePrefix || '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof CountryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        await createCountryMutation.mutateAsync(formData);
        toast.success('Country created successfully');
      } else if (country) {
        const updateData: UpdateCountryData = { ...formData };
        await updateCountryMutation.mutateAsync({ id: country.id, data: updateData });
        toast.success('Country updated successfully');
      }
      
      router.push('/admin/settings/countries');
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create country' : 'Failed to update country');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || createCountryMutation.isPending || updateCountryMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings/countries">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Countries
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6" />
            {mode === 'create' ? 'Add Country' : 'Edit Country'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' 
              ? 'Configure a new country for shipping and billing'
              : `Update settings for ${country?.name}`
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Country Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="US, GB, AE"
                    maxLength={2}
                    required
                    disabled={mode === 'edit'}
                  />
                  <p className="text-xs text-gray-500">ISO 3166-1 alpha-2 code</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flagEmoji">Flag Emoji</Label>
                  <Input
                    id="flagEmoji"
                    value={formData.flagEmoji}
                    onChange={(e) => handleInputChange('flagEmoji', e.target.value)}
                    placeholder="🇺🇸"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Country Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="United States"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => handleInputChange('region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subregion">Subregion</Label>
                  <Input
                    id="subregion"
                    value={formData.subregion}
                    onChange={(e) => handleInputChange('subregion', e.target.value)}
                    placeholder="Western Europe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phonePrefix">Phone Prefix</Label>
                <Input
                  id="phonePrefix"
                  value={formData.phonePrefix}
                  onChange={(e) => handleInputChange('phonePrefix', e.target.value)}
                  placeholder="1, 44, 971"
                />
                <p className="text-xs text-gray-500">Without the + symbol</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Customs */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping & Customs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', !!checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-gray-500">Country is available for selection</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isShippingEnabled"
                    checked={formData.isShippingEnabled}
                    onCheckedChange={(checked) => handleInputChange('isShippingEnabled', !!checked)}
                  />
                  <Label htmlFor="isShippingEnabled">Shipping Enabled</Label>
                  <p className="text-xs text-gray-500">Allow shipping to this country</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresPostalCode"
                    checked={formData.requiresPostalCode}
                    onCheckedChange={(checked) => handleInputChange('requiresPostalCode', !!checked)}
                  />
                  <Label htmlFor="requiresPostalCode">Requires Postal Code</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresStateProvince"
                    checked={formData.requiresStateProvince}
                    onCheckedChange={(checked) => handleInputChange('requiresStateProvince', !!checked)}
                  />
                  <Label htmlFor="requiresStateProvince">Requires State/Province</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="euMember"
                    checked={formData.euMember}
                    onCheckedChange={(checked) => handleInputChange('euMember', !!checked)}
                  />
                  <Label htmlFor="euMember">EU Member</Label>
                  <p className="text-xs text-gray-500">European Union member state</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customsFormType">Customs Form Type</Label>
                <Select
                  value={formData.customsFormType}
                  onValueChange={(value) => handleInputChange('customsFormType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customs form" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMS_FORM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Link href="/admin/settings/countries">
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Country' : 'Update Country'}
          </Button>
        </div>
      </form>
    </div>
  );
}