'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Edit, MoreHorizontal, Settings, Activity, Users, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Warehouse } from '../types/warehouse.types';

interface WarehouseHeaderProps {
  warehouse: Warehouse;
  onBack: () => void;
}

export function WarehouseHeader({ warehouse, onBack }: WarehouseHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="h-6 w-6" />
            {warehouse.name}
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <span>{warehouse.code}</span>
            <span>•</span>
            <MapPin className="h-4 w-4" />
            <span>{warehouse.city}, {warehouse.countryCode}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/admin/warehouses/${warehouse.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configure Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Activity className="mr-2 h-4 w-4" />
              View Activity Log
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Manage Assignments
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
