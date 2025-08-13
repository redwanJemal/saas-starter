// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  MapPin, 
  FileText, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Activity,
  Eye,
  ExternalLink,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { getUserWithProfile } from '@/lib/db/queries';
import { getEnhancedCustomerDashboardStats, getCustomerRecentPackages, getCustomerRecentIncomingItems } from '@/lib/db/queries-customer-enhanced';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { VirtualAddresses } from './components/virtual-addresses';

// Component for enhanced dashboard stats
async function EnhancedDashboardStats() {
  const userWithProfile = await getUserWithProfile();
  if (!userWithProfile?.customerProfile) {
    redirect('/sign-in');
  }

  const stats = await getEnhancedCustomerDashboardStats(userWithProfile.customerProfile.id);

  const statCards = [
    {
      title: 'Total Packages',
      value: stats.totalPackages,
      subtitle: `${stats.packagesReady} ready to ship`,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dashboard/packages',
      trend: stats.recentPackages > 0 ? `+${stats.recentPackages} this month` : null
    },
    {
      title: 'Incoming Items',
      value: stats.incomingItems,
      subtitle: 'Awaiting processing',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/dashboard/packages?tab=incoming',
      trend: stats.incomingItems > 0 ? 'Action required' : 'All processed'
    },
    {
      title: 'Active Shipments',
      value: stats.shipmentsInTransit,
      subtitle: `${stats.shipmentsDelivered} delivered`,
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/dashboard/shipments',
      trend: stats.recentShipments > 0 ? `+${stats.recentShipments} this month` : null
    },
    {
      title: 'Saved Addresses',
      value: stats.totalAddresses,
      subtitle: 'Shipping destinations',
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/dashboard/addresses',
      trend: null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
              {stat.value > 0 && stat.title === 'Incoming Items' && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
              {stat.trend && (
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend}
                </p>
              )}
            </div>
            <Link href={stat.href}>
              <Button variant="ghost" size="sm" className="w-full mt-3 justify-between">
                View Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Component for recent packages
async function RecentPackages() {
  const userWithProfile = await getUserWithProfile();
  if (!userWithProfile?.customerProfile) {
    return null;
  }

  const packages = await getCustomerRecentPackages(userWithProfile.customerProfile.id, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_to_ship':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'received':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready_to_ship':
        return Clock;
      case 'shipped':
        return Truck;
      case 'delivered':
        return CheckCircle;
      case 'received':
        return Package;
      default:
        return AlertCircle;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Recent Packages
        </CardTitle>
        <Link href="/dashboard/packages">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {packages.length > 0 ? (
          <div className="space-y-4">
            {packages.map((pkg) => {
              const StatusIcon = getStatusIcon(pkg.status || '');
              return (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <StatusIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{pkg.internalId}</p>
                        <Badge className={getStatusColor(pkg.status || '')} variant="outline">
                          {pkg.status?.replace('_', ' ')}
                        </Badge>
                        {pkg.isHighValue && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200">
                            High Value
                          </Badge>
                        )}
                        {pkg.isFragile && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Fragile
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {pkg.senderName || 'Unknown Sender'}
                        {pkg.estimatedValue > 0 && (
                          <span className="ml-2">
                            • {formatCurrency(pkg.estimatedValue, pkg.estimatedValueCurrency)}
                          </span>
                        )}
                      </p>
                      {pkg.description && (
                        <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {pkg.receivedAt 
                          ? `Received ${format(new Date(pkg.receivedAt), 'MMM d, yyyy')}`
                          : `Created ${format(new Date(pkg.createdAt), 'MMM d, yyyy')}`
                        }
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/packages/${pkg.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages yet</h3>
            <p className="text-gray-600">
              Your packages will appear here once they arrive at our warehouse.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for incoming items notifications
async function IncomingItemsAlert() {
  const userWithProfile = await getUserWithProfile();
  if (!userWithProfile?.customerProfile) {
    return null;
  }

  const incomingItems = await getCustomerRecentIncomingItems(userWithProfile.customerProfile.id, 3);

  if (incomingItems.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bell className="h-5 w-5" />
          Incoming Items Notification
          <Badge variant="destructive">{incomingItems.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-orange-700 mb-4">
          You have {incomingItems.length} item{incomingItems.length > 1 ? 's' : ''} that arrived at our warehouse and are awaiting processing.
        </p>
        <div className="space-y-3">
          {incomingItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.trackingNumber}</p>
                  <p className="text-sm text-gray-600">
                    Assigned {item.assignedAt ? format(new Date(item.assignedAt), 'MMM d, HH:mm') : 'recently'}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.courierTrackingUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.courierTrackingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/dashboard/packages?tab=incoming">
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              View All Incoming Items
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for package status overview chart
async function PackageStatusOverview() {
  const userWithProfile = await getUserWithProfile();
  if (!userWithProfile?.customerProfile) {
    return null;
  }

  const stats = await getEnhancedCustomerDashboardStats(userWithProfile.customerProfile.id);

  if (stats.totalPackages === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Package Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No packages to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Expected':
        return 'bg-yellow-500';
      case 'Received':
        return 'bg-blue-500';
      case 'Ready To Ship':
        return 'bg-green-500';
      case 'Shipped':
        return 'bg-purple-500';
      case 'Delivered':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Package Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.packagesByStatus.map((statusData) => {
            const percentage = Math.round((statusData.count / stats.totalPackages) * 100);
            return (
              <div key={statusData.status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {statusData.label}
                  </span>
                  <span className="text-sm text-gray-600">
                    {statusData.count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatusColor(statusData.label)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Total: <span className="font-medium">{stats.totalPackages}</span> packages
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


// Skeleton components
function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentPackagesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Packages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to your package forwarding dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <EnhancedDashboardStats />
      </Suspense>

      {/* Incoming Items Alert */}
      <Suspense fallback={null}>
        <IncomingItemsAlert />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Recent Packages */}
        <Suspense fallback={<RecentPackagesSkeleton />}>
          <RecentPackages />
        </Suspense>

        {/* Package Status Overview or Virtual Addresses */}
        <div className="space-y-6">
          <Suspense fallback={<RecentPackagesSkeleton />}>
            <PackageStatusOverview />
          </Suspense>
          
          <Suspense fallback={<RecentPackagesSkeleton />}>
            <VirtualAddresses />
          </Suspense>
        </div>
      </div>
    </section>
  );
}