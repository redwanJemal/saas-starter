// components/admin/receiving/PackageDeclaration.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, FileSignature, AlertTriangle, Shield } from 'lucide-react';

interface PackageDeclarationProps {
  formData: {
    estimatedValue: number;
    estimatedValueCurrency: string;
    customsDescription: string;
    hasProhibitedItems: boolean;
    requiresInspection: boolean;
    inspectionNotes: string;
  };
  onChange: (updates: Partial<PackageDeclarationProps['formData']>) => void;
}

const CURRENCIES = [
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

const PROHIBITED_ITEMS = [
  'Liquids or gels',
  'Batteries (lithium)',
  'Aerosols or sprays',
  'Perfumes or cosmetics',
  'Food or perishables',
  'Weapons or dangerous goods',
  'Counterfeit items',
  'Adult content',
  'Prescription medications',
  'Other restricted items'
];

export function PackageDeclaration({ formData, onChange }: PackageDeclarationProps) {
  const selectedCurrency = CURRENCIES.find(c => c.code === formData.estimatedValueCurrency);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Customs Declaration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estimated Value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="estimatedValue" className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Estimated Value *
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 font-medium px-3 py-2 border rounded-md bg-gray-50">
                {selectedCurrency?.symbol || '$'}
              </span>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.estimatedValue || ''}
                onChange={(e) => onChange({ estimatedValue: parseFloat(e.target.value) || 0 })}
                className="flex-1"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the commercial value of the package contents
            </p>
          </div>

          <div>
            <Label htmlFor="currency" className="text-sm font-medium">
              Currency
            </Label>
            <Select
              value={formData.estimatedValueCurrency}
              onValueChange={(value) => onChange({ estimatedValueCurrency: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customs Description */}
        <div>
          <Label htmlFor="customsDescription" className="text-sm font-medium">
            Detailed Customs Description
          </Label>
          <Textarea
            id="customsDescription"
            placeholder="Detailed description for customs purposes (e.g., 'Men's cotton t-shirt, blue, size large, brand: Nike')"
            value={formData.customsDescription}
            onChange={(e) => onChange({ customsDescription: e.target.value })}
            className="mt-1"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide a detailed description including material, color, size, brand, and quantity
          </p>
        </div>

        {/* Compliance Checks */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Compliance & Safety Checks
          </h4>

          {/* Prohibited Items Check */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="prohibitedItems"
                checked={formData.hasProhibitedItems}
                onCheckedChange={(checked) => 
                  onChange({ hasProhibitedItems: checked as boolean })
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="prohibitedItems"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Package contains prohibited or restricted items
                </Label>
                <p className="text-xs text-gray-500">
                  Check this if the package contains any items that may be restricted for shipping
                </p>
              </div>
            </div>

            {formData.hasProhibitedItems && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Prohibited Items Detected
                  </span>
                </div>
                <p className="text-xs text-red-700 mb-2">
                  Common prohibited items include:
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs text-red-600">
                  {PROHIBITED_ITEMS.map((item, index) => (
                    <div key={index}>• {item}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inspection Required */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="requiresInspection"
                checked={formData.requiresInspection}
                onCheckedChange={(checked) => 
                  onChange({ requiresInspection: checked as boolean })
                }
              />
              <div className="space-y-1 flex-1">
                <Label
                  htmlFor="requiresInspection"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Package requires detailed inspection
                </Label>
                <p className="text-xs text-gray-500">
                  Check this if the package needs further inspection before shipping
                </p>
              </div>
            </div>

            {formData.requiresInspection && (
              <div className="mt-3">
                <Label htmlFor="inspectionNotes" className="text-sm font-medium">
                  Inspection Notes
                </Label>
                <Textarea
                  id="inspectionNotes"
                  placeholder="Describe why inspection is needed and any specific concerns..."
                  value={formData.inspectionNotes}
                  onChange={(e) => onChange({ inspectionNotes: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>

        {/* Declaration Guidelines */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Customs Declaration Guidelines
          </h4>
          <div className="space-y-2 text-xs text-blue-800">
            <div>
              <strong>Value Declaration:</strong>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• Use the commercial/retail value of items</li>
                <li>• Include original purchase price if known</li>
                <li>• For gifts, declare fair market value</li>
                <li>• Under-declaring values may cause customs delays</li>
              </ul>
            </div>
            <div>
              <strong>Description Best Practices:</strong>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• Be specific (avoid generic terms like "clothing" or "electronics")</li>
                <li>• Include material, brand, model, color, size</li>
                <li>• Use English descriptions for international shipping</li>
                <li>• Avoid abbreviations that may cause confusion</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Value Warnings */}
        {formData.estimatedValue > 0 && (
          <div className="space-y-2">
            {formData.estimatedValue > 1000 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  High-value package (over {selectedCurrency?.symbol}1,000) may require additional documentation
                </span>
              </div>
            )}
            
            {formData.estimatedValue > 5000 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">
                  Very high-value package (over {selectedCurrency?.symbol}5,000) requires special handling and insurance
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}