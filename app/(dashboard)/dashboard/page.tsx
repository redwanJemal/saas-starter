// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { 
  getUserWithProfile, 
  getCustomerDashboardStats,
  getCustomerPackages,
  getCustomerShipments,
  getCustomerVirtualAddresses
} from '@/lib/db/queries';
import { redirect } from 'next/navigation';

// Component for dashboard stats
async function DashboardStats() {
  const userWithProfile = await getUserWithProfile();
  
  if (!userWithProfile?.customerProfile) {
    redirect('/sign-in');
  }

  const stats = await getCustomerDashboardStats(userWithProfile.customerProfile.id);

  const statCards = [
    {
      title: 'Total Packages',
      value: stats.totalPackages,
      subtitle: `${stats.packagesReady} ready to ship`,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dashboard/packages'
    },
    {
      title: 'Active Shipments', 
      value: stats.shipmentsInTransit,
      subtitle: `${stats.shipmentsDelivered} delivered`,
      icon: Truck,
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      href: '/dashboard/shipments'
    },
    {
      title: 'Saved Addresses',
      value: stats.totalAddresses,
      subtitle: 'Shipping destinations',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/dashboard/addresses'
    },
    {
      title: 'Total Shipments',
      value: stats.totalShipments,
      subtitle: 'All time',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/dashboard/invoices'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.subtitle}
                </p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
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

  const packages = await getCustomerPackages(userWithProfile.customerProfile.id, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_to_ship': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready_to_ship': return Clock;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'received': return Package;
      default: return AlertCircle;
    }
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
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <StatusIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {pkg.description || `Package ${pkg.internalId}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        From: {pkg.senderName || 'Unknown sender'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Warehouse: {pkg.warehouse.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(pkg.status || '')}
                    >
                      {pkg.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No packages yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Packages will appear here when they arrive at our warehouse
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for virtual addresses
async function VirtualAddresses() {
  const userWithProfile = await getUserWithProfile();
  
  if (!userWithProfile?.customerProfile) {
    return null;
  }

  const virtualAddresses = await getCustomerVirtualAddresses(userWithProfile.customerProfile.id);
  const customerId = userWithProfile.customerProfile.customerId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Your Virtual Addresses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {virtualAddresses.length > 0 ? (
          <div className="space-y-4">
            {virtualAddresses.map((assignment) => (
              <div 
                key={assignment.id} 
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {assignment.warehouse.name}
                    </p>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p className="font-medium">{userWithProfile.firstName} {userWithProfile.lastName} ({customerId})</p>
                      <p>{assignment.warehouse.addressLine1}</p>
                      {assignment.warehouse.addressLine2 && (
                        <p>{assignment.warehouse.addressLine2}</p>
                      )}
                      <p>
                        {assignment.warehouse.city}, {assignment.warehouse.postalCode}
                      </p>
                      <p>{assignment.warehouse.countryCode}</p>
                      {assignment.warehouse.phone && (
                        <p>Phone: {assignment.warehouse.phone}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No virtual addresses available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading components
function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
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
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
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
        <DashboardStats />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Packages */}
        <Suspense fallback={<RecentPackagesSkeleton />}>
          <RecentPackages />
        </Suspense>

        {/* Virtual Addresses */}
        <Suspense fallback={<RecentPackagesSkeleton />}>
          <VirtualAddresses />
        </Suspense>
      </div>
    </section>
  );
}