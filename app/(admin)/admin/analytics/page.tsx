'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Package, Truck, Users, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface AnalyticsData {
  totalCustomers: number;
  activeCustomers: number;
  totalPackages: number;
  packagesThisMonth: number;
  totalShipments: number;
  shipmentsThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  averagePackageValue: number;
  topWarehouses: Array<{
    name: string;
    code: string;
    packageCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // This would be a real API call
      // const response = await fetch('/api/admin/analytics');
      // const data = await response.json();
      
      // Mock data for now
      const mockData: AnalyticsData = {
        totalCustomers: 1247,
        activeCustomers: 892,
        totalPackages: 5634,
        packagesThisMonth: 423,
        totalShipments: 3891,
        shipmentsThisMonth: 298,
        totalRevenue: 234567.89,
        revenueThisMonth: 18432.45,
        averagePackageValue: 125.67,
        topWarehouses: [
          { name: 'Miami Warehouse', code: 'MIA', packageCount: 1234 },
          { name: 'New York Warehouse', code: 'NYC', packageCount: 987 },
          { name: 'Los Angeles Warehouse', code: 'LAX', packageCount: 756 },
        ],
        recentActivity: [
          { type: 'package', description: 'Package PKG-12345 received at Miami warehouse', timestamp: '2 minutes ago' },
          { type: 'shipment', description: 'Shipment SHP-67890 dispatched to customer', timestamp: '15 minutes ago' },
          { type: 'customer', description: 'New customer registered: john.doe@example.com', timestamp: '1 hour ago' },
          { type: 'payment', description: 'Invoice INV-54321 paid by customer', timestamp: '2 hours ago' },
        ]
      };
      
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'package':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'shipment':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'customer':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <BarChart3 className="h-6 w-6 animate-pulse text-gray-400" />
          <span className="ml-2 text-gray-500">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Platform performance metrics and insights</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeCustomers.toLocaleString()} active
            </p>
            <Badge variant="outline" className="mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% this month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPackages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.packagesThisMonth.toLocaleString()} this month
            </p>
            <Badge variant="outline" className="mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8% this month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalShipments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.shipmentsThisMonth.toLocaleString()} this month
            </p>
            <Badge variant="outline" className="mt-2">
              <TrendingDown className="h-3 w-3 mr-1" />
              -3% this month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.revenueThisMonth)} this month
            </p>
            <Badge variant="outline" className="mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15% this month
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Warehouses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topWarehouses.map((warehouse, index) => (
                <div key={warehouse.code} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{warehouse.name}</div>
                      <div className="text-sm text-gray-500">{warehouse.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{warehouse.packageCount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">packages</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900">{activity.description}</div>
                    <div className="text-xs text-gray-500">{activity.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Average Package Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(analytics.averagePackageValue)}</div>
            <p className="text-sm text-gray-500 mt-1">
              Based on declared values
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Customer Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100)}%
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Active customer rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Fulfillment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round((analytics.totalShipments / analytics.totalPackages) * 100)}%
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Packages successfully shipped
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}