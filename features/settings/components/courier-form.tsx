// features/settings/components/courier-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, Save, ArrowLeft, ExternalLink, Package, Settings } from 'lucide-react';
import Link from 'next/link';
import { useCreateCourier, useUpdateCourier } from '@/features/settings/hooks/use-settings-query';
import { Courier, CourierFormData, UpdateCourierData } from '@/features/settings/types/settings.types';
import { toast } from 'sonner';

interface CourierFormProps {
  courier?: Courier;
  mode: 'create' | 'edit';
}

export function CourierForm({ courier, mode }: CourierFormProps) {
  const router = useRouter();
  const createCourierMutation = useCreateCourier();
  const updateCourierMutation = useUpdateCourier();

  const [formData, setFormData] = useState<CourierFormData>({
    code: courier?.code || '',
    name: courier?.name || '',
    website: courier?.website || '',
    trackingUrlTemplate: courier?.trackingUrlTemplate || '',
    isActive: courier?.isActive ?? true,
    apiCredentials: courier?.apiCredentials || {},
    integrationSettings: courier?.integrationSettings || {},
  });

  const [loading, setLoading] = useState(false);
  const [apiCredentialsJson, setApiCredentialsJson] = useState(
    JSON.stringify(courier?.apiCredentials || {}, null, 2)
  );
  const [integrationSettingsJson, setIntegrationSettingsJson] = useState(
    JSON.stringify(courier?.integrationSettings || {}, null, 2)
  );

  const handleInputChange = (field: keyof CourierFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJsonChange = (field: 'apiCredentials' | 'integrationSettings', value: string) => {
    if (field === 'apiCredentials') {
      setApiCredentialsJson(value);
    } else {
      setIntegrationSettingsJson(value);
    }

    try {
      const parsed = JSON.parse(value);
      handleInputChange(field, parsed);
    } catch (error) {
      // Invalid JSON, don't update the form data
    }
  };

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate JSON fields
    if (apiCredentialsJson && !validateJson(apiCredentialsJson)) {
      toast.error('Invalid JSON in API Credentials');
      setLoading(false);
      return;
    }

    if (integrationSettingsJson && !validateJson(integrationSettingsJson)) {
      toast.error('Invalid JSON in Integration Settings');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        apiCredentials: apiCredentialsJson ? JSON.parse(apiCredentialsJson) : {},
        integrationSettings: integrationSettingsJson ? JSON.parse(integrationSettingsJson) : {},
      };

      if (mode === 'create') {
        await createCourierMutation.mutateAsync(submitData);
        toast.success('Courier created successfully');
      } else if (courier) {
        const updateData: UpdateCourierData = { ...submitData };
        await updateCourierMutation.mutateAsync({ id: courier.id, data: updateData });
        toast.success('Courier updated successfully');
      }
      
      router.push('/admin/settings/couriers');
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create courier' : 'Failed to update courier');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || createCourierMutation.isPending || updateCourierMutation.isPending;

  const getTrackingPreview = () => {
    if (!formData.trackingUrlTemplate) return 'No tracking URL template';
    return formData.trackingUrlTemplate.replace('{tracking_number}', 'ABC123456789');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings/couriers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Couriers
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-6 w-6" />
            {mode === 'create' ? 'Add Courier' : 'Edit Courier'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' 
              ? 'Configure a new courier service'
              : `Update settings for ${courier?.name}`
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
                  <Label htmlFor="code">Courier Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="FEDEX, DHL, UPS"
                    required
                    disabled={mode === 'edit'}
                  />
                  <p className="text-xs text-gray-500">Unique identifier</p>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', !!checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Courier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="FedEx, DHL Express, UPS"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.fedex.com"
                />
                {formData.website && (
                  <a
                    href={formData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visit website
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tracking Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tracking Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trackingUrlTemplate">Tracking URL Template</Label>
                <Input
                  id="trackingUrlTemplate"
                  value={formData.trackingUrlTemplate}
                  onChange={(e) => handleInputChange('trackingUrlTemplate', e.target.value)}
                  placeholder="https://www.fedex.com/track?trknbr={tracking_number}"
                />
                <p className="text-xs text-gray-500">
                  Use {'{tracking_number}'} as placeholder for the actual tracking number
                </p>
              </div>

              {formData.trackingUrlTemplate && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <Label className="text-sm font-medium">Preview:</Label>
                  <a
                    href={getTrackingPreview()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:text-blue-800 mt-1 break-all"
                  >
                    {getTrackingPreview()}
                    <ExternalLink className="inline h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Integration */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                API Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiCredentials">API Credentials (JSON)</Label>
                <Textarea
                  id="apiCredentials"
                  value={apiCredentialsJson}
                  onChange={(e) => handleJsonChange('apiCredentials', e.target.value)}
                  placeholder='{\n  "api_key": "your_api_key",\n  "secret": "your_secret"\n}'
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-gray-500">
                  Store API keys and authentication credentials (will be encrypted)
                </p>
                {apiCredentialsJson && !validateJson(apiCredentialsJson) && (
                  <p className="text-xs text-red-600">Invalid JSON format</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="integrationSettings">Integration Settings (JSON)</Label>
                <Textarea
                  id="integrationSettings"
                  value={integrationSettingsJson}
                  onChange={(e) => handleJsonChange('integrationSettings', e.target.value)}
                  placeholder='{\n  "base_url": "https://api.courier.com",\n  "timeout": 30,\n  "retry_attempts": 3\n}'
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-gray-500">
                  Configure integration behavior and settings
                </p>
                {integrationSettingsJson && !validateJson(integrationSettingsJson) && (
                  <p className="text-xs text-red-600">Invalid JSON format</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Link href="/admin/settings/couriers">
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={
                isSubmitting || 
                (apiCredentialsJson ? !validateJson(apiCredentialsJson) : false) ||
                (integrationSettingsJson ? !validateJson(integrationSettingsJson) : false)
            }
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Courier' : 'Update Courier'}
          </Button>
        </div>
      </form>
    </div>
  );
}