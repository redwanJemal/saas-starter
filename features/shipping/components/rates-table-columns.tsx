// features/shipping/components/rates-table-columns.tsx

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Building, Globe, DollarSign, Calendar, Weight, AlertTriangle } from 'lucide-react';
import { ShippingRate, CURRENCY_CODES } from '../types/rate.types';
import { ServiceTypeBadge } from './service-type-badge';
import { RateActionsDropdown } from './rate-actions-dropdown';

export const createRatesTableColumns = (
  onEdit: (rate: ShippingRate) => void,
  onDelete: (rateId: string) => void,
  onToggleStatus: (rateId: string, isActive: boolean) => void,
  onDuplicate?: (rate: ShippingRate) => void,
  onCalculate?: (rate: ShippingRate) => void
): ColumnDef<ShippingRate>[] => [
  {
    accessorKey: 'warehouse',
    header: 'Route',
    cell: ({ row }) => {
      const rate = row.original;
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">
              {rate.warehouse?.name || 'Unknown Warehouse'}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {rate.warehouse?.code} → {rate.zone?.name || 'Unknown Zone'}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'serviceType',
    header: 'Service',
    cell: ({ row }) => {
      const rate = row.original;
      return <ServiceTypeBadge serviceType={rate.serviceType} />;
    },
  },
  {
    accessorKey: 'rates',
    header: 'Rates',
    cell: ({ row }) => {
      const rate = row.original;
      const currency = CURRENCY_CODES.find(c => c.code === rate.currencyCode);
      const symbol = currency?.symbol || '$';
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-3 w-3 text-gray-400" />
            <span className="font-medium">{symbol}{rate.baseRate.toFixed(2)}</span>
            <span className="text-gray-500">base</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Weight className="h-3 w-3 text-gray-400" />
            <span className="font-medium">{symbol}{rate.perKgRate.toFixed(2)}/kg</span>
          </div>
          <div className="text-xs text-gray-500">
            Min: {symbol}{rate.minCharge.toFixed(2)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'validity',
    header: 'Validity',
    cell: ({ row }) => {
      const rate = row.original;
      const now = new Date();
      const effectiveFrom = new Date(rate.effectiveFrom);
      const effectiveUntil = rate.effectiveUntil ? new Date(rate.effectiveUntil) : null;
      
      const isExpired = effectiveUntil && effectiveUntil < now;
      const isNotYetActive = effectiveFrom > now;
      const isActive = !isExpired && !isNotYetActive;
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span>{effectiveFrom.toLocaleDateString()}</span>
          </div>
          {effectiveUntil && (
            <div className="text-sm text-gray-500">
              to {effectiveUntil.toLocaleDateString()}
            </div>
          )}
          {isExpired && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          )}
          {isNotYetActive && (
            <Badge variant="secondary" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Future
            </Badge>
          )}
          {isActive && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
              Active
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const rate = row.original;
      const now = new Date();
      const effectiveFrom = new Date(rate.effectiveFrom);
      const effectiveUntil = rate.effectiveUntil ? new Date(rate.effectiveUntil) : null;
      
      const isExpired = effectiveUntil && effectiveUntil < now;
      const isNotYetActive = effectiveFrom > now;
      
      if (!rate.isActive) {
        return (
          <Badge variant="secondary">
            Inactive
          </Badge>
        );
      }
      
      if (isExpired) {
        return (
          <Badge variant="destructive">
            Expired
          </Badge>
        );
      }
      
      if (isNotYetActive) {
        return (
          <Badge variant="outline" className="border-orange-200 text-orange-800">
            Scheduled
          </Badge>
        );
      }
      
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          Active
        </Badge>
      );
    },
  },
  {
    accessorKey: 'maxWeightKg',
    header: 'Max Weight',
    cell: ({ row }) => {
      const rate = row.original;
      return (
        <div className="text-sm">
          {rate.maxWeightKg ? (
            <span className="font-medium">{rate.maxWeightKg}kg</span>
          ) : (
            <span className="text-gray-500">No limit</span>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const rate = row.original;
      return (
        <div className="flex justify-end">
          <RateActionsDropdown
            rate={rate}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            onDuplicate={onDuplicate}
            onCalculate={onCalculate}
          />
        </div>
      );
    },
  },
];