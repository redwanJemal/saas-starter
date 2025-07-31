// features/shipping/components/shipping-quick-actions.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Globe, DollarSign, Calculator, Settings, FileText } from 'lucide-react';
import Link from 'next/link';

export function ShippingQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/admin/shipping/zones">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Zone
            </Button>
          </Link>
          
          <Link href="/admin/shipping/rates">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <DollarSign className="mr-2 h-4 w-4" />
              Create Rate
            </Button>
          </Link>
          
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Calculator className="mr-2 h-4 w-4" />
            Rate Calculator
          </Button>
          
          <Button variant="outline" className="w-full justify-start" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Export Rates
          </Button>
        </div>
        
        <div className="pt-2 border-t">
          <Link href="/admin/shipping/zones">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Globe className="mr-2 h-4 w-4" />
              Manage Zones
            </Button>
          </Link>
          
          <Link href="/admin/shipping/rates">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <DollarSign className="mr-2 h-4 w-4" />
              Manage Rates
            </Button>
          </Link>
          
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Shipping Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}