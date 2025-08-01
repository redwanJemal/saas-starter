// features/packages/components/receiving/package-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, AlertTriangle, Package, Scale, Ruler } from 'lucide-react';
import { CreatePackageData } from '@/features/packages/types/package.types';

interface PackageFormProps {
  assignedItem: {
    id: string;
    trackingNumber: string;
    customerName: string;
    customerEmail: string;
    assignedCustomerProfileId: string;
    courierName?: string;
  };
  onSubmit: (data: CreatePackageData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PackageForm({ assignedItem, onSubmit, onCancel, isSubmitting = false }: PackageFormProps) {
  const [formData, setFormData] = useState({
    // Basic Info
    description: '',
    senderName: '',
    senderCompany: '',
    senderAddress: '',
    
    // Measurements
    weightKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    
    // Declaration
    estimatedValue: '',
    estimatedValueCurrency: 'GBP',
    customsDescription: '',
    
    // Status
    status: 'received',
    statusNotes: '',
    
    // Compliance
    hasProhibitedItems: false,
    requiresInspection: false,
    inspectionNotes: '',
    isFragile: false,
    isHighValue: false,
    
    // System
    receivedAt: new Date().toISOString().slice(0, 16)
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const packageData: CreatePackageData = {
      customerProfileId: assignedItem.assignedCustomerProfileId,
      incomingShipmentItemId: assignedItem.id,
      trackingNumberInbound: assignedItem.trackingNumber,
      description: formData.description,
      senderName: formData.senderName,
      senderCompany: formData.senderCompany || undefined,
      senderAddress: formData.senderAddress || undefined,
      weightActualKg: parseFloat(formData.weightKg) || 0,
      lengthCm: formData.lengthCm ? parseFloat(formData.lengthCm) : undefined,
      widthCm: formData.widthCm ? parseFloat(formData.widthCm) : undefined,
      heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
      estimatedValue: parseFloat(formData.estimatedValue) || 0,
      estimatedValueCurrency: formData.estimatedValueCurrency,
      status: formData.status as any,
      statusNotes: formData.statusNotes || undefined,
      isFragile: formData.isFragile,
      isHighValue: formData.isHighValue,
      receivedAt: formData.receivedAt,
    };

    await onSubmit(packageData);
  };

  const isFormValid = formData.description && formData.weightKg && parseFloat(formData.weightKg) > 0;

  return (
    <div className="space-y-6">
      {/* Assigned Item Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium">Tracking Number</label>
              <div className="font-mono">{assignedItem.trackingNumber}</div>
            </div>
            <div>
              <label className="font-medium">Customer</label>
              <div>{assignedItem.customerName}</div>
              <div className="text-gray-500">{assignedItem.customerEmail}</div>
            </div>
            {assignedItem.courierName && (
              <div>
                <label className="font-medium">Courier</label>
                <div>{assignedItem.courierName}</div>
              </div>
            )}
            <div>
              <label className="font-medium">Customer ID</label>
              <div className="font-mono">{assignedItem.assignedCustomerProfileId}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the package contents"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={formData.senderName}
                onChange={(e) => handleInputChange('senderName', e.target.value)}
                placeholder="Sender's name"
              />
            </div>
            <div>
              <Label htmlFor="senderCompany">Sender Company</Label>
              <Input
                id="senderCompany"
                value={formData.senderCompany}
                onChange={(e) => handleInputChange('senderCompany', e.target.value)}
                placeholder="Company name (optional)"
              />
            </div>
            <div>
              <Label htmlFor="receivedAt">Received At</Label>
              <Input
                id="receivedAt"
                type="datetime-local"
                value={formData.receivedAt}
                onChange={(e) => handleInputChange('receivedAt', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="senderAddress">Sender Address</Label>
            <Textarea
              id="senderAddress"
              value={formData.senderAddress}
              onChange={(e) => handleInputChange('senderAddress', e.target.value)}
              placeholder="Full sender address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Physical Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Physical Measurements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="weightKg">Weight (kg) *</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.001"
                value={formData.weightKg}
                onChange={(e) => handleInputChange('weightKg', e.target.value)}
                placeholder="0.000"
                required
              />
            </div>
            <div>
              <Label htmlFor="lengthCm">Length (cm)</Label>
              <Input
                id="lengthCm"
                type="number"
                step="0.1"
                value={formData.lengthCm}
                onChange={(e) => handleInputChange('lengthCm', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="widthCm">Width (cm)</Label>
              <Input
                id="widthCm"
                type="number"
                step="0.1"
                value={formData.widthCm}
                onChange={(e) => handleInputChange('widthCm', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                step="0.1"
                value={formData.heightCm}
                onChange={(e) => handleInputChange('heightCm', e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          {formData.lengthCm && formData.widthCm && formData.heightCm && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                <span>
                  Volume: {(parseFloat(formData.lengthCm) * parseFloat(formData.widthCm) * parseFloat(formData.heightCm) / 1000000).toFixed(3)} m³
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customs Declaration */}
      <Card>
        <CardHeader>
          <CardTitle>Customs Declaration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedValue">Estimated Value</Label>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                value={formData.estimatedValue}
                onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="estimatedValueCurrency">Currency</Label>
              <Select
                value={formData.estimatedValueCurrency}
                onValueChange={(value) => handleInputChange('estimatedValueCurrency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="AED">AED (د.إ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="customsDescription">Customs Description</Label>
            <Textarea
              id="customsDescription"
              value={formData.customsDescription}
              onChange={(e) => handleInputChange('customsDescription', e.target.value)}
              placeholder="Detailed description for customs"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Compliance & Special Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="hasProhibitedItems">Contains Prohibited Items</Label>
                <Switch
                  id="hasProhibitedItems"
                  checked={formData.hasProhibitedItems}
                  onCheckedChange={(checked) => handleInputChange('hasProhibitedItems', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requiresInspection">Requires Inspection</Label>
                <Switch
                  id="requiresInspection"
                  checked={formData.requiresInspection}
                  onCheckedChange={(checked) => handleInputChange('requiresInspection', checked)}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isFragile">Fragile Item</Label>
                <Switch
                  id="isFragile"
                  checked={formData.isFragile}
                  onCheckedChange={(checked) => handleInputChange('isFragile', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isHighValue">High Value Item</Label>
                <Switch
                  id="isHighValue"
                  checked={formData.isHighValue}
                  onCheckedChange={(checked) => handleInputChange('isHighValue', checked)}
                />
              </div>
            </div>
          </div>

          {(formData.requiresInspection || formData.hasProhibitedItems) && (
            <div>
              <Label htmlFor="inspectionNotes">Inspection Notes</Label>
              <Textarea
                id="inspectionNotes"
                value={formData.inspectionNotes}
                onChange={(e) => handleInputChange('inspectionNotes', e.target.value)}
                placeholder="Additional notes for inspection or compliance"
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-2">
            {formData.isFragile && <Badge variant="outline">Fragile</Badge>}
            {formData.isHighValue && <Badge variant="outline">High Value</Badge>}
            {formData.hasProhibitedItems && <Badge variant="destructive">Prohibited Items</Badge>}
            {formData.requiresInspection && <Badge variant="secondary">Requires Inspection</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Status & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">Package Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="held">Held</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="statusNotes">Status Notes</Label>
            <Textarea
              id="statusNotes"
              value={formData.statusNotes}
              onChange={(e) => handleInputChange('statusNotes', e.target.value)}
              placeholder="Additional notes about the package status"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormValid}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Complete Receiving
            </>
          )}
        </Button>
      </div>
    </div>
  );
}