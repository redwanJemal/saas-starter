// features/settings/components/currency-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Save, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { useCreateCurrency, useUpdateCurrency } from '@/features/settings/hooks/use-settings-query';
import { Currency, CurrencyFormData, UpdateCurrencyData } from '@/features/settings/types/settings.types';
import { toast } from 'sonner';

interface CurrencyFormProps {
  currency?: Currency;
  mode: 'create' | 'edit';
}

export function CurrencyForm({ currency, mode }: CurrencyFormProps) {
  const router = useRouter();
  const createCurrencyMutation = useCreateCurrency();
  const updateCurrencyMutation = useUpdateCurrency();

  const [formData, setFormData] = useState<CurrencyFormData>({
    code: currency?.code || '',
    name: currency?.name || '',
    symbol: currency?.symbol || '',
    isActive: currency?.isActive ?? true,
    decimalPlaces: currency?.decimalPlaces ?? 2,
    symbolPosition: currency?.symbolPosition as 'before' | 'after' || 'before',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof CurrencyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        await createCurrencyMutation.mutateAsync(formData);
        toast.success('Currency created successfully');
      } else if (currency) {
        const updateData: UpdateCurrencyData = { ...formData };
        await updateCurrencyMutation.mutateAsync({ id: currency.id, data: updateData });
        toast.success('Currency updated successfully');
      }
      
      router.push('/admin/settings/currencies');
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create currency' : 'Failed to update currency');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || createCurrencyMutation.isPending || updateCurrencyMutation.isPending;

  // Format preview
  const getFormattedPreview = (amount: number = 1234.56) => {
    const formatted = amount.toFixed(formData.decimalPlaces || 0);
    return formData.symbolPosition === 'before' 
      ? `${formData.symbol}${formatted}`
      : `${formatted}${formData.symbol}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings/currencies">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Currencies
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            {mode === 'create' ? 'Add Currency' : 'Edit Currency'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' 
              ? 'Configure a new currency for transactions'
              : `Update settings for ${currency?.name}`
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
                  <Label htmlFor="code">Currency Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="USD, EUR, GBP"
                    maxLength={3}
                    required
                    disabled={mode === 'edit'}
                  />
                  <p className="text-xs text-gray-500">ISO 4217 code</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol *</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                    placeholder="$, €, £"
                    maxLength={5}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Currency Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="US Dollar, Euro, British Pound"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', !!checked)}
                />
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-gray-500">Currency is available for use</p>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="decimalPlaces">Decimal Places</Label>
                <Select
                  value={formData.decimalPlaces?.toString()}
                  onValueChange={(value) => handleInputChange('decimalPlaces', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select decimal places" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (e.g., ¥1235)</SelectItem>
                    <SelectItem value="2">2 (e.g., $12.35)</SelectItem>
                    <SelectItem value="3">3 (e.g., $12.345)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Number of decimal places to display</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbolPosition">Symbol Position</Label>
                <Select
                  value={formData.symbolPosition}
                  onValueChange={(value: 'before' | 'after') => handleInputChange('symbolPosition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before Amount ($12.34)</SelectItem>
                    <SelectItem value="after">After Amount (12.34€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-medium">Preview</Label>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Small amount:</span>
                    <span className="font-mono">{getFormattedPreview(12.34)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Large amount:</span>
                    <span className="font-mono">{getFormattedPreview(1234567.89)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zero decimals:</span>
                    <span className="font-mono">{getFormattedPreview(100)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Link href="/admin/settings/currencies">
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Currency' : 'Update Currency'}
          </Button>
        </div>
      </form>
    </div>
  );
}