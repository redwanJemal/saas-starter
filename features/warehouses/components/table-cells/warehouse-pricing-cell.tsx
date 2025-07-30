'use client';

import { DollarSign } from 'lucide-react';
import { Warehouse } from '../../types/warehouse.types';

interface WarehousePricingCellProps {
  warehouse: Warehouse;
}

export function WarehousePricingCell({ warehouse }: WarehousePricingCellProps) {
  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatWeight = (weight: string): string => {
    const num = parseFloat(weight);
    return Number.isFinite(num) ? `${num.toFixed(1)} kg` : 'N/A';
  };

  const formatValue = (value: string, currency: string): string => {
    const num = parseFloat(value);
    return Number.isFinite(num) ? formatCurrency(value, currency) : 'N/A';
  };

  return (
    <div className="space-y-1 text-xs min-w-[140px]">
      <div className="flex items-center gap-1">
        <DollarSign className="h-3 w-3 text-gray-400" />
        <span className="font-medium">
          {formatCurrency(warehouse.storageFeePerDay, warehouse.currencyCode)}
        </span>
        <span className="text-gray-500">per day</span>
      </div>
      
      <div className="text-gray-600">
        Free days: <span className="font-medium">{warehouse.storageFreeDays}</span>
      </div>
      
      <div className="text-gray-600">
        Max weight: <span className="font-medium">{formatWeight(warehouse.maxPackageWeightKg)}</span>
      </div>
      
      <div className="text-gray-600">
        Max value: <span className="font-medium">{formatValue(warehouse.maxPackageValue, warehouse.currencyCode)}</span>
      </div>
    </div>
  );
}
