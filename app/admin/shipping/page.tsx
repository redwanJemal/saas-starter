// app/admin/shipping/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, AlertCircle, TrendingUp, Globe, DollarSign } from 'lucide-react';

import { ShippingOverviewStats } from '@/features/shipping/components/shipping-overview-stats';
import { ShippingQuickActions } from '@/features/shipping/components/shipping-quick-actions';
import { ShippingRecentActivity } from '@/features/shipping/components/shipping-recent-activity';

interface DashboardStats {
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
}

interface ActivityItem {
  id: string;
  type: 'zone_created' | 'zone_updated' | 'rate_created' | 'rate_updated' | 'rate_deleted';
  description: string;
  timestamp: string;
  user?: string;
  metadata?: {
    zoneName?: string;
    warehouseName?: string;
    serviceType?: string;
  };
}

export default function ShippingDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats
      const statsResponse = await fetch('/api/admin/shipping/dashboard/stats');
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch shipping statistics');
      }
      const statsData = await statsResponse.json();
      setStats(statsData.stats);

      // Fetch recent activities
      const activitiesResponse = await fetch('/api/admin/shipping/dashboard/activities?limit=10');
      if (!activitiesResponse.ok) {
        throw new Error('Failed to fetch recent activities');
      }
      const activitiesData = await activitiesResponse.json();
      setActivities(activitiesData.activities || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration (remove when API is ready)
  useEffect(() => {
    if (!stats && !loading) {
      setStats({
        totalZones: 8,
        activeZones: 6,
        totalRates: 24,
        activeRates: 18,
        averageBaseRate: 12.50,
        averagePerKgRate: 8.75,
        mostPopularZone: {
          name: 'GCC Countries',
          rateCount: 8
        },
        recentlyUpdated: 3
      });

      setActivities([
        {
          id: '1',
          type: 'rate_created',
          description: 'New shipping rate created for express service',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: 'Admin User',
          metadata: {
            zoneName: 'Europe',
            warehouseName: 'Dubai Warehouse',
            serviceType: 'Express'
          }
        },
        {
          id: '2',
          type: 'zone_updated',
          description: 'Updated GCC Countries zone configuration',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          user: 'Admin User',
          metadata: {
            zoneName: 'GCC Countries'
          }
        },
        {
          id: '3',
          type: 'rate_updated',
          description: 'Modified base rate for standard service',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          user: 'Admin User',
          metadata: {
            zoneName: 'Asia Pacific',
            serviceType: 'Standard'
          }
        }
      ]);
    }
  }, [stats, loading]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Shipping Management
          </h1>
          <p className="text-gray-600">
            Overview of shipping zones, rates, and recent activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Dashboard
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <ShippingOverviewStats 
        stats={stats || {
          totalZones: 0,
          activeZones: 0,
          totalRates: 0,
          activeRates: 0,
          averageBaseRate: 0,
          averagePerKgRate: 0,
          recentlyUpdated: 0
        }}
        isLoading={loading}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <ShippingQuickActions />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <ShippingRecentActivity 
            activities={activities}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Zone and Rate Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zones Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Shipping Zones Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Zones</span>
                <span className="font-semibold">{stats?.totalZones || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Zones</span>
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  {stats?.activeZones || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Most Popular</span>
                <span className="text-sm font-medium">
                  {stats?.mostPopularZone?.name || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rates Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Shipping Rates Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Rates</span>
                <span className="font-semibold">{stats?.totalRates || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Rates</span>
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  {stats?.activeRates || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Base Rate</span>
                <span className="text-sm font-medium">
                  ${stats?.averageBaseRate?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Per Kg</span>
                <span className="text-sm font-medium">
                  ${stats?.averagePerKgRate?.toFixed(2) || '0.00'}/kg
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}