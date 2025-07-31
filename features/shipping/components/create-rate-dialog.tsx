// features/shipping/components/create-rate-dialog.tsx

'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Calculator } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateShippingRateData, SERVICE_TYPES, CURRENCY_CODES } from '../types/rate.types';
import { Zone } from '../types/zone.types';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  countryCode: string;
}

interface CreateRateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateShippingRateData) => Promise<void>;
  isSubmitting: boolean;
  warehouses: Warehouse[];
  zones: Zone[];
}

export function CreateRateDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  warehouses,
  zones
}: CreateRateDialogProps) {
  const [formData, setFormData] = useState<CreateShippingRateData>({
    warehouseId: '',
    zoneId: '',
    serviceType: 'standard',
    baseRate: 0,
    perKgRate: 0,
    minCharge: 0,
    maxWeightKg: undefined,
    currencyCode: 'USD',
    isActive: true,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveUntil: undefined,
  });

  const [errors, setErrors] = useState<Partial<CreateShippingRateData>>({});
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [testWeight, setTestWeight] = useState<number>(1);

  // Calculate estimated cost for testing
  useEffect(() => {
    if (formData.baseRate && formData.perKgRate && testWeight) {
      const weightCost = formData.perKgRate * testWeight;
      const totalCost = formData.baseRate + weightCost;
      const finalCost = Math.max(totalCost, formData.minCharge);
      setCalculatedCost(finalCost);
    } else {
      setCalculatedCost(null);
    }
  }, [formData.baseRate, formData.perKgRate, formData.minCharge, testWeight]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateShippingRateData> = {};

    if (!formData.warehouseId) {
      newErrors.warehouseId = 'Warehouse is required';
    }

    if (!formData.zoneId) {
      newErrors.zoneId = 'Zone is required';
    }

    if (!formData.baseRate || formData.baseRate <= 0) {
      newErrors.baseRate = 'Base rate must be greater than 0' as any;
    }

    if (!formData.perKgRate || formData.perKgRate <= 0) {
      newErrors.perKgRate = 'Per kg rate must be greater than 0' as any;
    }

    if (!formData.minCharge || formData.minCharge <= 0) {
      newErrors.minCharge = 'Minimum charge must be greater than 0' as any;
    }

    if (!formData.effectiveFrom) {
      newErrors.effectiveFrom = 'Effective from date is required' as any;
    }

    if (formData.effectiveUntil && formData.effectiveFrom && 
        new Date(formData.effectiveUntil) <= new Date(formData.effectiveFrom)) {
      newErrors.effectiveUntil = 'End date must be after start date' as any;
    }

    if (formData.maxWeightKg && formData.maxWeightKg <= 0) {
      newErrors.maxWeightKg = 'Max weight must be greater than 0' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        warehouseId: '',
        zoneId: '',
        serviceType: 'standard',
        baseRate: 0,
        perKgRate: 0,
        minCharge: 0,
        maxWeightKg: undefined,
        currencyCode: 'USD',
        isActive: true,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveUntil: undefined,
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating rate:', error);
    }
  };

  const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId);
  const selectedZone = zones.find(z => z.id === formData.zoneId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Shipping Rate
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Shipping Rate</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warehouse and Zone Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse *</Label>
              <Select
                value={formData.warehouseId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, warehouseId: value }))}
              >
                <SelectTrigger className={errors.warehouseId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouseId && (
                <p className="text-sm text-red-600">{errors.warehouseId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">Zone *</Label>
              <Select
                value={formData.zoneId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, zoneId: value }))}
              >
                <SelectTrigger className={errors.zoneId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.filter(z => z.isActive).map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} ({zone.countryCount} countries)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zoneId && (
                <p className="text-sm text-red-600">{errors.zoneId}</p>
              )}
            </div>
          </div>

          {/* Service Type and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, serviceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(service => (
                    <SelectItem key={service.value} value={service.value}>
                      <div className="flex flex-col">
                        <span>{service.label}</span>
                        <span className="text-xs text-muted-foreground">{service.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currencyCode}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currencyCode: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_CODES.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseRate">Base Rate *</Label>
              <Input
                id="baseRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.baseRate}
                onChange={(e) => setFormData(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className={errors.baseRate ? 'border-red-500' : ''}
              />
              {errors.baseRate && (
                <p className="text-sm text-red-600">{errors.baseRate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="perKgRate">Per KG Rate *</Label>
              <Input
                id="perKgRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.perKgRate}
                onChange={(e) => setFormData(prev => ({ ...prev, perKgRate: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className={errors.perKgRate ? 'border-red-500' : ''}
              />
              {errors.perKgRate && (
                <p className="text-sm text-red-600">{errors.perKgRate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minCharge">Min Charge *</Label>
              <Input
                id="minCharge"
                type="number"
                step="0.01"
                min="0"
                value={formData.minCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, minCharge: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className={errors.minCharge ? 'border-red-500' : ''}
              />
              {errors.minCharge && (
                <p className="text-sm text-red-600">{errors.minCharge}</p>
              )}
            </div>
          </div>

          {/* Optional Max Weight */}
          <div className="space-y-2">
            <Label htmlFor="maxWeight">Max Weight (KG)</Label>
            <Input
              id="maxWeight"
              type="number"
              step="0.001"
              min="0"
              value={formData.maxWeightKg || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxWeightKg: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
              placeholder="Leave empty for no limit"
              className={errors.maxWeightKg ? 'border-red-500' : ''}
            />
            {errors.maxWeightKg && (
              <p className="text-sm text-red-600">{errors.maxWeightKg}</p>
            )}
          </div>

          {/* Effective Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From *</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                className={errors.effectiveFrom ? 'border-red-500' : ''}
              />
              {errors.effectiveFrom && (
                <p className="text-sm text-red-600">{errors.effectiveFrom}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveUntil">Effective Until</Label>
              <Input
                id="effectiveUntil"
                type="date"
                value={formData.effectiveUntil || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  effectiveUntil: e.target.value || undefined 
                }))}
                className={errors.effectiveUntil ? 'border-red-500' : ''}
              />
              {errors.effectiveUntil && (
                <p className="text-sm text-red-600">{errors.effectiveUntil}</p>
              )}
              <p className="text-xs text-muted-foreground">Leave empty for no end date</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isActive: !!checked }))
              }
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {/* Rate Calculator Preview */}
          {formData.baseRate > 0 && formData.perKgRate > 0 && formData.minCharge > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Rate Calculator Preview</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testWeight">Test Weight (KG)</Label>
                  <Input
                    id="testWeight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={testWeight}
                    onChange={(e) => setTestWeight(parseFloat(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex flex-col justify-end">
                  {calculatedCost !== null && (
                    <div className="text-lg font-semibold text-blue-900">
                      {CURRENCY_CODES.find(c => c.code === formData.currencyCode)?.symbol || ''}
                      {calculatedCost.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              
              {calculatedCost !== null && (
                <div className="mt-2 text-sm text-blue-700">
                  <div>Base Rate: {CURRENCY_CODES.find(c => c.code === formData.currencyCode)?.symbol || ''}{formData.baseRate.toFixed(2)}</div>
                  <div>Weight Charge: {CURRENCY_CODES.find(c => c.code === formData.currencyCode)?.symbol || ''}{(formData.perKgRate * testWeight).toFixed(2)} ({testWeight}kg × {CURRENCY_CODES.find(c => c.code === formData.currencyCode)?.symbol || ''}{formData.perKgRate.toFixed(2)})</div>
                  {calculatedCost === formData.minCharge && (
                    <div className="text-orange-600">Minimum charge applied</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.warehouseId || !formData.zoneId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Rate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}