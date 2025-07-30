'use client';

import { Building, Globe, MapPin } from 'lucide-react';
import { Warehouse } from '../../types/warehouse.types';

interface WarehouseDetailsCellProps {
  warehouse: Warehouse;
}

export function WarehouseDetailsCell({ warehouse }: WarehouseDetailsCellProps) {
  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-2 mb-1">
        <Building className="h-4 w-4 text-gray-400" />
        <span className="font-medium">{warehouse.name}</span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <div>Code: <span className="font-mono">{warehouse.code}</span></div>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>
            {warehouse.city}, 
            {warehouse.stateProvince ? `${warehouse.stateProvince}, ` : ''}
            {warehouse.countryCode}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          <span>{warehouse.timezone}</span>
        </div>
      </div>
    </div>
  );
}
