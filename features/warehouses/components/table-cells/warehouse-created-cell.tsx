'use client';

import { Warehouse } from '../../types/warehouse.types';

interface WarehouseCreatedCellProps {
  warehouse: Warehouse;
}

export function WarehouseCreatedCell({ warehouse }: WarehouseCreatedCellProps) {
  return (
    <div className="text-sm">
      <div>{new Date(warehouse.createdAt).toLocaleDateString()}</div>
      <div className="text-xs text-gray-500">
        {new Date(warehouse.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  );
}
