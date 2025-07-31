// features/shipping/components/create-zone-dialog.tsx

'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateZoneData, COMMON_COUNTRIES } from '../types/zone.types';

interface CreateZoneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateZoneData) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateZoneDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting
}: CreateZoneDialogProps) {
  const [formData, setFormData] = useState<CreateZoneData>({
    name: '',
    description: '',
    isActive: true,
    countries: [],
  });

  const [errors, setErrors] = useState<Partial<CreateZoneData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateZoneData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Zone name is required';
    }

    if (formData.countries.length === 0) {
      newErrors.countries = 'At least one country must be selected' as any;
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
        name: '',
        description: '',
        isActive: true,
        countries: [],
      });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating zone:', error);
    }
  };

  const toggleCountry = (countryCode: string) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.includes(countryCode)
        ? prev.countries.filter(c => c !== countryCode)
        : [...prev.countries, countryCode]
    }));
  };

  const selectAllGCC = () => {
    const gccCountries = ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'];
    setFormData(prev => ({
      ...prev,
      countries: [...new Set([...prev.countries, ...gccCountries])]
    }));
  };

  const selectAllEurope = () => {
    const europeCountries = ['GB', 'DE', 'FR', 'NL', 'BE', 'IT', 'ES', 'PT', 'AT', 'CH'];
    setFormData(prev => ({
      ...prev,
      countries: [...new Set([...prev.countries, ...europeCountries])]
    }));
  };

  const clearSelection = () => {
    setFormData(prev => ({ ...prev, countries: [] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Zone
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Shipping Zone</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., GCC Countries, Europe, Asia Pacific"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isActive: !!checked }))
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this shipping zone"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Countries *</Label>
            <p className="text-sm text-muted-foreground">
              Select countries that belong to this zone:
            </p>
            
            {/* Quick selection buttons */}
            <div className="flex gap-2 mb-3">
              <Button type="button" variant="outline" size="sm" onClick={selectAllGCC}>
                Select GCC
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={selectAllEurope}>
                Select Europe
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
              {COMMON_COUNTRIES.map(country => (
                <div key={country.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`country-${country.code}`}
                    checked={formData.countries.includes(country.code)}
                    onCheckedChange={() => toggleCountry(country.code)}
                  />
                  <Label htmlFor={`country-${country.code}`} className="text-sm cursor-pointer">
                    {country.code} - {country.name}
                  </Label>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Selected: {formData.countries.length} countries
            </p>
            
            {errors.countries && (
              <p className="text-sm text-red-600">{errors.countries}</p>
            )}
          </div>
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
            disabled={isSubmitting || !formData.name.trim() || formData.countries.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Zone'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}