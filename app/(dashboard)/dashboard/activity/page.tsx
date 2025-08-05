// app/(dashboard)/dashboard/activity/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  Package,
  Truck,
  MapPin,
  FileText,
  CreditCard,
  Shield,
  type LucideIcon,
  Activity,
} from 'lucide-react';
import { getActivityLogs } from '@/lib/db/queries';

// Activity type to icon mapping for customer activities
const iconMap: Record<string, LucideIcon> = {
  // Authentication
  'SIGN_UP': UserPlus,
  'SIGN_IN': UserCog,
  'SIGN_OUT': LogOut,
  
  // Profile & Security
  'PROFILE_UPDATED': Settings,
  'PASSWORD_CHANGED': Lock,
  'ACCOUNT_DELETED': AlertCircle,
  
  // Package operations
  'PACKAGE_RECEIVED': Package,
  'PACKAGE_READY_TO_SHIP': Package,
  'PACKAGE_SHIPPED': Truck,
  'PACKAGE_DELIVERED': Package,
  
  // Shipment operations
  'SHIPMENT_CREATED': Truck,
  'SHIPMENT_PAID': CreditCard,
  'SHIPMENT_DISPATCHED': Truck,
  'SHIPMENT_DELIVERED': Truck,
  
  // Address management
  'ADDRESS_ADDED': MapPin,
  'ADDRESS_UPDATED': MapPin,
  'ADDRESS_DELETED': MapPin,
  
  // Financial
  'INVOICE_CREATED': FileText,
  'INVOICE_PAID': CreditCard,
  'PAYMENT_PROCESSED': CreditCard,
  
  // Security & KYC
  'KYC_SUBMITTED': Shield,
  'KYC_APPROVED': Shield,
  'KYC_REJECTED': Shield,
  
  // Default
  'DEFAULT': Settings
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    // Authentication
    'SIGN_UP': 'You created your account',
    'SIGN_IN': 'You signed in',
    'SIGN_OUT': 'You signed out',
    
    // Profile & Security
    'PROFILE_UPDATED': 'You updated your profile',
    'PASSWORD_CHANGED': 'You changed your password',
    'ACCOUNT_DELETED': 'You deleted your account',
    
    // Package operations
    'PACKAGE_RECEIVED': 'A package was received at the warehouse',
    'PACKAGE_READY_TO_SHIP': 'Your package is ready to ship',
    'PACKAGE_SHIPPED': 'Your package was shipped',
    'PACKAGE_DELIVERED': 'Your package was delivered',
    
    // Shipment operations
    'SHIPMENT_CREATED': 'You created a shipment',
    'SHIPMENT_PAID': 'You paid for a shipment',
    'SHIPMENT_DISPATCHED': 'Your shipment was dispatched',
    'SHIPMENT_DELIVERED': 'Your shipment was delivered',
    
    // Address management
    'ADDRESS_ADDED': 'You added a new address',
    'ADDRESS_UPDATED': 'You updated an address',
    'ADDRESS_DELETED': 'You deleted an address',
    
    // Financial
    'INVOICE_CREATED': 'An invoice was created',
    'INVOICE_PAID': 'You paid an invoice',
    'PAYMENT_PROCESSED': 'Your payment was processed',
    
    // Security & KYC
    'KYC_SUBMITTED': 'You submitted KYC documents',
    'KYC_APPROVED': 'Your KYC was approved',
    'KYC_REJECTED': 'Your KYC was rejected',
  };

  return actionMap[action] || `${action.toLowerCase().replace(/_/g, ' ')} occurred`;
}

function getActivityColor(action: string): string {
  const colorMap: Record<string, string> = {
    // Success actions
    'SIGN_UP': 'bg-green-100 text-green-600',
    'PACKAGE_DELIVERED': 'bg-green-100 text-green-600',
    'SHIPMENT_DELIVERED': 'bg-green-100 text-green-600',
    'INVOICE_PAID': 'bg-green-100 text-green-600',
    'PAYMENT_PROCESSED': 'bg-green-100 text-green-600',
    'KYC_APPROVED': 'bg-green-100 text-green-600',
    
    // Warning/Info actions
    'SIGN_IN': 'bg-blue-100 text-blue-600',
    'PACKAGE_RECEIVED': 'bg-blue-100 text-blue-600',
    'PACKAGE_READY_TO_SHIP': 'bg-orange-100 text-orange-600',
    'SHIPMENT_CREATED': 'bg-blue-100 text-blue-600',
    'SHIPMENT_DISPATCHED': 'bg-blue-100 text-blue-600',
    'INVOICE_CREATED': 'bg-blue-100 text-blue-600',
    
    // Neutral actions
    'PROFILE_UPDATED': 'bg-gray-100 text-gray-600',
    'PASSWORD_CHANGED': 'bg-gray-100 text-gray-600',
    'ADDRESS_ADDED': 'bg-gray-100 text-gray-600',
    'ADDRESS_UPDATED': 'bg-gray-100 text-gray-600',
    'KYC_SUBMITTED': 'bg-yellow-100 text-yellow-600',
    
    // Warning/Error actions
    'SIGN_OUT': 'bg-gray-100 text-gray-600',
    'ADDRESS_DELETED': 'bg-red-100 text-red-600',
    'ACCOUNT_DELETED': 'bg-red-100 text-red-600',
    'KYC_REJECTED': 'bg-red-100 text-red-600',
  };

  return colorMap[action] || 'bg-gray-100 text-gray-600';
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600 mt-1">
          Track your account activity and package operations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log: any) => {
                const Icon = iconMap[log.action] || iconMap.DEFAULT;
                const formattedAction = formatAction(log.action);
                const colorClass = getActivityColor(log.action);

                return (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`rounded-full p-2 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formattedAction}
                          </p>
                          {log.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {log.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{getRelativeTime(new Date(log.createdAt))}</span>
                            {log.ipAddress && (
                              <>
                                <span>•</span>
                                <span>IP: {log.ipAddress}</span>
                              </>
                            )}
                            {log.resourceType && log.resourceType !== 'user' && (
                              <>
                                <span>•</span>
                                <span className="capitalize">
                                  {log.resourceType.replace(/_/g, ' ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="bg-gray-100 rounded-full p-3 mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Your account activity will appear here. This includes sign-ins, 
                package updates, shipments, and profile changes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}