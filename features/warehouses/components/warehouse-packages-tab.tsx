'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface WarehousePackagesTabProps {
  warehouseId: string;
}

export function WarehousePackagesTab({ warehouseId }: WarehousePackagesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Package Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Package management interface coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
