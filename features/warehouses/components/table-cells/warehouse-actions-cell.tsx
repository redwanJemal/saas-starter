'use client';

import { AlertTriangle, Building, Edit, Eye, MoreHorizontal, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Warehouse } from '../../types/warehouse.types';

interface WarehouseActionsCellProps {
  warehouse: Warehouse;
  onViewDetails?: (warehouse: Warehouse) => void;
}

export function WarehouseActionsCell({ warehouse, onViewDetails }: WarehouseActionsCellProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => onViewDetails?.(warehouse)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/warehouses/${warehouse.id}`}>
            <Building className="mr-2 h-4 w-4" />
            Open Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/warehouses/${warehouse.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Warehouse
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/warehouses/${warehouse.id}/bins`}>
            <Package className="mr-2 h-4 w-4" />
            Manage Bins
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/warehouses/${warehouse.id}/assignments`}>
            <Settings className="mr-2 h-4 w-4" />
            Customer Assignments
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-orange-600"
          onClick={() => {
            // Handle deactivate/maintenance mode
            console.log('Toggle warehouse status:', warehouse.id);
          }}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {warehouse.status === 'active' ? 'Set Maintenance' : 'Activate'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
