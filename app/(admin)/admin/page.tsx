// app/(admin)/admin/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Users, 
  Truck, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

// Mock data - replace with actual API calls
const adminStats = {
  totalPackages: 1247,
  packagesChange: 12.5,
  totalCustomers: 842,
  customersChange: 8.3,
  activeShipments: 156,
  shipmentsChange: -2.1,
  monthlyRevenue: 125430,
  revenueChange: 15.2,
};

const recentPackages = [
  {
    id: 'PKG-001234',
    customerName: 'Sarah Ahmed',
    customerId: 'PF-590738',
    warehouse: 'UK1',
    status: 'ready_to_ship',
    receivedAt: '2025-01-23T10:30:00Z',
    value: '$125.00'
  },
  {
    id: 'PKG-001235',
    customerName: 'Ahmed Hassan',
    customerId: 'PF-591025',
    warehouse: 'UK1',
    status: 'received',
    receivedAt: '2025-01-23T09:15:00Z',
    value: '$89.50'
  },
  {
    id: 'PKG-001236',
    customerName: 'Fatima Al-Zahra',
    customerId: 'PF-590912',
    warehouse: 'UK1',
    status: 'processing',
    receivedAt: '2025-01-23T08:45:00Z',
    value: '$245.00'
  },
  {
    id: 'PKG-001237',
    customerName: 'Omar Abdullah',
    customerId: 'PF-591156',
    warehouse: 'UK1',
    status: 'held',
    receivedAt: '2025-01-22T16:20:00Z',
    value: '$320.00'
  }
];

const pendingActions = [
  {
    type: 'kyc_review',
    title: 'KYC Documents Pending Review',
    description: '3 customers awaiting verification',
    urgency: 'high',
    count: 3
  },
  {
    type: 'held_packages',
    title: 'Packages on Hold',
    description: '2 packages require attention',
    urgency: 'medium',
    count: 2
  },
  {
    type: 'payment_issues',
    title: 'Payment Failures',
    description: '5 failed payments this week',
    urgency: 'medium',
    count: 5
  },
  {
    type: 'warehouse_alerts',
    title: 'Warehouse Capacity',
    description: 'UK1 warehouse at 85% capacity',
    urgency: 'low',
    count: 1
  }
];

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  href 
}: { 
  title: string; 
  value: string | number; 
  change: number; 
  icon: React.ComponentType<{ className?: string }>; 
  href: string;
}) {
  const isPositive = change > 0;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="flex items-center justify-between">
          <div className={`flex items-center text-xs ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {Math.abs(change)}% from last month
          </div>
          <Link href={href}>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              View <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  const statusConfig = {
    received: { color: 'bg-blue-100 text-blue-800', label: 'Received' },
    processing: { color: 'bg-yellow-100 text-yellow-800', label: 'Processing' },
    ready_to_ship: { color: 'bg-green-100 text-green-800', label: 'Ready to Ship' },
    shipped: { color: 'bg-blue-100 text-blue-800', label: 'Shipped' },
    held: { color: 'bg-red-100 text-red-800', label: 'On Hold' },
    delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.received;
  
  return (
    <Badge variant="secondary" className={`${config.color} text-xs`}>
      {config.label}
    </Badge>
  );
}

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'high': return 'border-red-200 bg-red-50';
    case 'medium': return 'border-yellow-200 bg-yellow-50';
    case 'low': return 'border-blue-200 bg-blue-50';
    default: return 'border-gray-200 bg-gray-50';
  }
}

function getUrgencyIcon(urgency: string) {
  switch (urgency) {
    case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'low': return <CheckCircle className="h-4 w-4 text-blue-500" />;
    default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your package forwarding platform
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Packages"
          value={adminStats.totalPackages}
          change={adminStats.packagesChange}
          icon={Package}
          href="/admin/packages"
        />
        <StatCard
          title="Active Customers"
          value={adminStats.totalCustomers}
          change={adminStats.customersChange}
          icon={Users}
          href="/admin/customers"
        />
        <StatCard
          title="Active Shipments"
          value={adminStats.activeShipments}
          change={adminStats.shipmentsChange}
          icon={Truck}
          href="/admin/shipments"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${adminStats.monthlyRevenue.toLocaleString()}`}
          change={adminStats.revenueChange}
          icon={DollarSign}
          href="/admin/payments"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Packages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Packages
              </CardTitle>
              <Link href="/admin/packages">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPackages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <Package className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{pkg.id}</span>
                          {getStatusBadge(pkg.status)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {pkg.customerName} ({pkg.customerId})
                        </div>
                        <div className="text-xs text-gray-500">
                          {pkg.warehouse} • {new Date(pkg.receivedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{pkg.value}</div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Requires Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingActions.map((action, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(action.urgency)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getUrgencyIcon(action.urgency)}
                          <span className="font-medium text-sm">{action.title}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {action.description}
                        </p>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                          Take Action <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {action.count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/packages/create">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Package className="h-6 w-6 mb-2" />
                <span className="text-sm">Create Package</span>
              </Button>
            </Link>
            <Link href="/admin/customers/create">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Users className="h-6 w-6 mb-2" />
                <span className="text-sm">Add Customer</span>
              </Button>
            </Link>
            <Link href="/admin/shipments/create">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Truck className="h-6 w-6 mb-2" />
                <span className="text-sm">Create Shipment</span>
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <TrendingUp className="h-6 w-6 mb-2" />
                <span className="text-sm">Generate Report</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}