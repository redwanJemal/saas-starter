'use client';

import { AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WarehouseStatusBadge } from '../warehouse-status-badge';
import { Warehouse } from '../../types/warehouse.types';

interface WarehouseStatusCellProps {
  warehouse: Warehouse;
}

export function WarehouseStatusCell({ warehouse }: WarehouseStatusCellProps) {
  return (
    <div className="space-y-2">
      <WarehouseStatusBadge status={warehouse.status} />
      {warehouse.acceptsNewPackages ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
          <Package className="h-3 w-3 mr-1" />
          Accepting Packages
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Not Accepting
        </Badge>
      )}
      <div className="text-xs text-gray-500">
        Tax: {warehouse.taxTreatment}
      </div>
    </div>
  );
}
