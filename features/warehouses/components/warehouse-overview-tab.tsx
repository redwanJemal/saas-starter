'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Warehouse } from '../types/warehouse.types';
import { WarehouseStatusBadge } from './warehouse-status-badge';
import { 
  Building, 
  Settings, 
  Phone, 
  Mail, 
  Globe, 
  DollarSign, 
  Calendar 
} from 'lucide-react';

interface WarehouseOverviewTabProps {
  warehouse: Warehouse;
}

export function WarehouseOverviewTab({ warehouse }: WarehouseOverviewTabProps) {
  // Utility functions
  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(num);
  };

  const formatWeight = (weight: string): string => {
    const num = parseFloat(weight);
    return Number.isFinite(num) ? `${num.toFixed(1)} kg` : 'N/A';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Warehouse Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Warehouse Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <WarehouseStatusBadge status={warehouse.status} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Accepts Packages</label>
              <div className="mt-1">
                <Badge variant={warehouse.acceptsNewPackages ? "default" : "secondary"}>
                  {warehouse.acceptsNewPackages ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <div className="mt-1 text-sm">
              <div>{warehouse.addressLine1}</div>
              {warehouse.addressLine2 && <div>{warehouse.addressLine2}</div>}
              <div>{warehouse.city}, {warehouse.stateProvince} {warehouse.postalCode}</div>
              <div>{warehouse.countryCode}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {warehouse.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <div className="mt-1 text-sm flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {warehouse.phone}
                </div>
              </div>
            )}
            {warehouse.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1 text-sm flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {warehouse.email}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Timezone & Currency</label>
            <div className="mt-1 text-sm flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {warehouse.timezone}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {warehouse.currencyCode}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Storage Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Storage Fee</label>
              <div className="mt-1 text-lg font-semibold">
                {formatCurrency(warehouse.storageFeePerDay, warehouse.currencyCode)}/day
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Free Days</label>
              <div className="mt-1 text-lg font-semibold">
                {warehouse.storageFreeDays} days
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Max Package Weight</label>
              <div className="mt-1 text-sm">
                {formatWeight(warehouse.maxPackageWeightKg)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Max Package Value</label>
              <div className="mt-1 text-sm">
                {formatCurrency(warehouse.maxPackageValue, warehouse.currencyCode)}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Tax Treatment</label>
            <div className="mt-1">
              <Badge variant="outline" className="capitalize">
                {warehouse.taxTreatment.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Created</label>
            <div className="mt-1 text-sm flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(warehouse.createdAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
