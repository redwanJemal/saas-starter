// app/(admin)/admin/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Truck, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  ShoppingCart, 
  ArrowRight, 
  RefreshCw,
  Bell,
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDistanceToNow } from '@/lib/utils';

interface DashboardStats {
  packages: {
    total: number;
    received: number;
    readyToShip: number;
    shipped: number;
    pending: number;
    processing: number;
  };
  personalShopping: {
    total: number;
    pending: number;
    quoted: number;
    paid: number;
    purchasing: number;
  };
  shipments: {
    total: number;
    processing: number;
    dispatched: number;
    delivered: number;
  };
  customers: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  financial: {
    monthlyRevenue: number;
    pendingPayments: number;
    currency: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'package' | 'shipment' | 'personal_shopping' | 'customer';
  title: string;
  description: string;
  timestamp: string;
  status: string;
  user?: string;
  href?: string;
}

interface LiveNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    // Set up Server-Sent Events for real-time updates (if available)
    setupRealtimeUpdates();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchDashboardData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) setLoading(true);
      
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/activity')
      ]);

      if (!statsResponse.ok || !activityResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsResponse.json();
      const activityData = await activityResponse.json();

      setStats(statsData);
      setRecentActivity(activityData.activities || []);
      setLastRefresh(new Date());
      
      if (isAutoRefresh) {
        // Add a subtle notification for auto-refresh
        addLiveNotification('Dashboard refreshed automatically', 'info');
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    // This would connect to Server-Sent Events or WebSocket
    // For now, we'll simulate with periodic checks
    // In production, you'd implement actual SSE or WebSocket connection
  };

  const addLiveNotification = (message: string, type: LiveNotification['type']) => {
    const notification: LiveNotification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date()
    };

    setLiveNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setLiveNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const handleManualRefresh = () => {
    fetchDashboardData();
    addLiveNotification('Dashboard data refreshed', 'success');
  };

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  if (error && !stats) {
    return <DashboardError error={error} onRetry={handleManualRefresh} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Live Updates */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your package forwarding operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live Notifications */}
          {liveNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500 animate-pulse" />
              <span className="text-sm text-green-600">Live</span>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            Last updated: {formatDistanceToNow(lastRefresh)} ago
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Notifications Toast */}
      {liveNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {liveNotifications.map(notification => (
            <div
              key={notification.id}
              className={`
                p-3 rounded-lg shadow-lg border transform transition-all duration-300 
                ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                ${notification.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
                ${notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
                ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Packages"
          value={stats?.packages.total || 0}
          icon={Package}
          trend="+12%"
          trendDirection="up"
          subtitle={`${stats?.packages.received || 0} received, ${stats?.packages.readyToShip || 0} ready to ship`}
          href="/admin/packages"
        />
        
        <StatCard
          title="Personal Shopping"
          value={stats?.personalShopping.total || 0}
          icon={ShoppingCart}
          trend="+8%"
          trendDirection="up"
          subtitle={`${stats?.personalShopping.pending || 0} pending, ${stats?.personalShopping.quoted || 0} quoted`}
          href="/admin/personal-shopping"
        />
        
        <StatCard
          title="Shipments"
          value={stats?.shipments.total || 0}
          icon={Truck}
          trend="+15%"
          trendDirection="up"
          subtitle={`${stats?.shipments.processing || 0} processing, ${stats?.shipments.dispatched || 0} dispatched`}
          href="/admin/shipments"
        />
        
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.financial.monthlyRevenue || 0)}
          icon={DollarSign}
          trend="+23%"
          trendDirection="up"
          subtitle={`${formatCurrency(stats?.financial.pendingPayments || 0)} pending`}
          href="/admin/invoices"
        />
      </div>

      {/* Operations Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Operations
              </CardTitle>
              <CardDescription>Manage incoming packages and processing</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/packages">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <OperationItem
              title="Pre-Receiving"
              count={stats?.packages.pending || 0}
              status="New"
              href="/admin/packages/pre-receiving"
              icon={Package}
              statusColor="bg-blue-100 text-blue-800"
            />
            <OperationItem
              title="Assignment"
              count={8}
              status="Pending"
              href="/admin/packages/assignment"
              icon={Users}
              statusColor="bg-yellow-100 text-yellow-800"
            />
            <OperationItem
              title="Package Receiving"
              count={stats?.packages.processing || 0}
              status="In Progress"
              href="/admin/packages/receiving"
              icon={CheckCircle}
              statusColor="bg-green-100 text-green-800"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Shipments
            </CardTitle>
            <CardDescription>Track outbound shipments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ShipmentStatusItem
              status="Processing"
              count={stats?.shipments.processing || 0}
              color="bg-blue-500"
            />
            <ShipmentStatusItem
              status="Dispatched"
              count={stats?.shipments.dispatched || 0}
              color="bg-orange-500"
            />
            <ShipmentStatusItem
              status="Delivered"
              count={stats?.shipments.delivered || 0}
              color="bg-green-500"
            />
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/admin/shipments">
                All Shipments <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates from your operations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ActivitySkeleton />
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Supporting Components

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendDirection?: 'up' | 'down';
  subtitle?: string;
  href?: string;
}

function StatCard({ title, value, icon: Icon, trend, trendDirection, subtitle, href }: StatCardProps) {
  const content = (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Icon className="h-6 w-6 text-orange-600" />
          </div>
          {trend && (
            <Badge variant={trendDirection === 'up' ? 'default' : 'destructive'} className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

interface OperationItemProps {
  title: string;
  count: number;
  status: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  statusColor: string;
}

function OperationItem({ title, count, status, href, icon: Icon, statusColor }: OperationItemProps) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-gray-500" />
          <div>
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-gray-500">{count} items</p>
          </div>
        </div>
        <Badge className={`${statusColor} text-xs`}>
          {status}
        </Badge>
      </div>
    </Link>
  );
}

interface ShipmentStatusItemProps {
  status: string;
  count: number;
  color: string;
}

function ShipmentStatusItem({ status, count, color }: ShipmentStatusItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-sm font-medium">{status}</span>
      </div>
      <Badge variant="secondary">{count}</Badge>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  return (
    <div className="flex items-start gap-3 p-3 border-l-2 border-gray-200 hover:border-orange-300 transition-colors">
      <div className="p-1 bg-blue-100 rounded">
        <Activity className="h-3 w-3 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-gray-500">{activity.timestamp}</p>
          {activity.user && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <p className="text-xs text-gray-500">by {activity.user}</p>
            </>
          )}
          <Badge variant="outline" className="text-xs">
            {activity.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Skeleton Components

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <ActivitySkeleton />
        </CardContent>
      </Card>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 border-l-2 border-gray-200">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-64 mb-2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}