'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Edit } from 'lucide-react';
import Link from 'next/link';
import { Warehouse } from '../types/warehouse.types';
import { WarehouseStatusBadge } from './warehouse-status-badge';

interface WarehouseSettingsTabProps {
  warehouse: Warehouse;
}

export function WarehouseSettingsTab({ warehouse }: WarehouseSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Warehouse Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Package Acceptance</h4>
              <p className="text-sm text-gray-600">
                Whether this warehouse accepts new incoming packages
              </p>
            </div>
            <Badge variant={warehouse.acceptsNewPackages ? "default" : "secondary"}>
              {warehouse.acceptsNewPackages ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Operational Status</h4>
              <p className="text-sm text-gray-600">
                Current operational status of this warehouse
              </p>
            </div>
            <WarehouseStatusBadge status={warehouse.status} />
          </div>

          <div className="pt-4">
            <Link href={`/admin/warehouses/${warehouse.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Warehouse Settings
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
