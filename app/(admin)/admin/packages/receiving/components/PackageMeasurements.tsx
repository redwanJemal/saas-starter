// app/(admin)/admin/packages/receiving/components/PackageMeasurements.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, Ruler, Calculator } from 'lucide-react';

interface PackageMeasurementsProps {
  formData: {
    weightActualKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  onChange: (updates: Partial<PackageMeasurementsProps['formData']>) => void;
}

export function PackageMeasurements({ formData, onChange }: PackageMeasurementsProps) {
  // Calculate volumetric weight and other metrics
  const volumetricWeightKg = (formData.lengthCm * formData.widthCm * formData.heightCm) / 5000;
  const volumeLiters = (formData.lengthCm * formData.widthCm * formData.heightCm) / 1000;
  const chargeableWeight = Math.max(formData.weightActualKg, volumetricWeightKg);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Package Measurements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight */}
        <div>
          <Label htmlFor="weight" className="text-sm font-medium flex items-center gap-1">
            <Scale className="h-3 w-3" />
            Actual Weight *
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id="weight"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.weightActualKg || ''}
              onChange={(e) => onChange({ weightActualKg: parseFloat(e.target.value) || 0 })}
              className="flex-1"
              required
            />
            <span className="text-sm text-gray-500 font-medium px-2">kg</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Weigh the package accurately including packaging materials
          </p>
        </div>

        {/* Dimensions */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-1 mb-3">
            <Ruler className="h-3 w-3" />
            Dimensions (Length × Width × Height)
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="length" className="text-xs text-gray-600">
                Length
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={formData.lengthCm || ''}
                  onChange={(e) => onChange({ lengthCm: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-xs text-gray-500">cm</span>
              </div>
            </div>
            <div>
              <Label htmlFor="width" className="text-xs text-gray-600">
                Width
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={formData.widthCm || ''}
                  onChange={(e) => onChange({ widthCm: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-xs text-gray-500">cm</span>
              </div>
            </div>
            <div>
              <Label htmlFor="height" className="text-xs text-gray-600">
                Height
              </Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={formData.heightCm || ''}
                  onChange={(e) => onChange({ heightCm: parseFloat(e.target.value) || 0 })}
                />
                <span className="text-xs text-gray-500">cm</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Measure the longest, widest, and highest points of the package
          </p>
        </div>

        {/* Calculated Values */}
        {(formData.weightActualKg > 0 || (formData.lengthCm > 0 && formData.widthCm > 0 && formData.heightCm > 0)) && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
              <Calculator className="h-4 w-4" />
              Calculated Values
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Volume:</span>
                <div className="font-medium">
                  {volumeLiters > 0 ? `${volumeLiters.toFixed(2)} L` : '—'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Volumetric Weight:</span>
                <div className="font-medium">
                  {volumetricWeightKg > 0 ? `${volumetricWeightKg.toFixed(2)} kg` : '—'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Chargeable Weight:</span>
                <div className="font-medium text-blue-600">
                  {chargeableWeight > 0 ? `${chargeableWeight.toFixed(2)} kg` : '—'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Weight Type:</span>
                <div className="font-medium">
                  {chargeableWeight === volumetricWeightKg ? 'Volumetric' : 'Actual'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Measurement Tips */}
        <div className="bg-amber-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-amber-900 mb-1">
            Measurement Guidelines
          </h4>
          <ul className="text-xs text-amber-800 space-y-1">
            <li>• Use a calibrated scale for accurate weight measurements</li>
            <li>• Measure from the outermost points including packaging</li>
            <li>• For irregular shapes, measure the maximum dimensions</li>
            <li>• Chargeable weight is the higher of actual or volumetric weight</li>
            <li>• Volumetric weight = (L × W × H cm) ÷ 5000</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}