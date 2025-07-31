// features/shipping/components/shipping-overview-stats.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, DollarSign, Truck, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface ShippingOverviewStatsProps {
  stats: {
    totalZones: number;
    activeZones: number;
    totalRates: number;
    activeRates: number;
    averageBaseRate: number;
    averagePerKgRate: number;
    mostPopularZone?: {
      name: string;
      rateCount: number;
    };
    recentlyUpdated: number;
  };
  isLoading?: boolean;
}

export function ShippingOverviewStats({ stats, isLoading }: ShippingOverviewStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const zoneUtilization = stats.totalZones > 0 ? (stats.activeZones / stats.totalZones) * 100 : 0;
  const rateUtilization = stats.totalRates > 0 ? (stats.activeRates / stats.totalRates) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Zones Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Shipping Zones</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalZones}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant={stats.activeZones === stats.totalZones ? "default" : "secondary"}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {stats.activeZones} active
            </Badge>
            <span className="text-xs text-muted-foreground">
              {zoneUtilization.toFixed(0)}% active
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Rates Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Shipping Rates</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRates}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant={rateUtilization >= 80 ? "default" : rateUtilization >= 50 ? "secondary" : "outline"}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {stats.activeRates} active
            </Badge>
            <span className="text-xs text-muted-foreground">
              {rateUtilization.toFixed(0)}% active
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Average Rates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rates</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <div className="text-lg font-bold">${stats.averageBaseRate.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Base rate</div>
            </div>
            <div>
              <div className="text-sm font-medium">${stats.averagePerKgRate.toFixed(2)}/kg</div>
              <div className="text-xs text-muted-foreground">Per kg rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Popular Zone */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Popular Zone</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.mostPopularZone?.name || 'N/A'}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="default" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {stats.mostPopularZone?.rateCount || 0} rates
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}