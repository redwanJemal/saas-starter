'use client';

import { Mail, Phone } from 'lucide-react';
import { Warehouse } from '../../types/warehouse.types';

interface WarehouseContactCellProps {
  warehouse: Warehouse;
}

export function WarehouseContactCell({ warehouse }: WarehouseContactCellProps) {
  return (
    <div className="space-y-1 min-w-[160px]">
      {warehouse.phone && (
        <div className="flex items-center gap-1 text-xs">
          <Phone className="h-3 w-3 text-gray-400" />
          <span>{warehouse.phone}</span>
        </div>
      )}
      {warehouse.email && (
        <div className="flex items-center gap-1 text-xs">
          <Mail className="h-3 w-3 text-gray-400" />
          <span className="truncate">{warehouse.email}</span>
        </div>
      )}
      {!warehouse.phone && !warehouse.email && (
        <span className="text-xs text-gray-400">No contact info</span>
      )}
      <div className="text-xs text-gray-500">
        Address: {warehouse.addressLine1}
        {warehouse.addressLine2 && `, ${warehouse.addressLine2}`}
      </div>
    </div>
  );
}
