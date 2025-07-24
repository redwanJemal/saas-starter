'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  Package, 
  Users, 
  Truck, 
  FileText, 
  Settings, 
  Shield, 
  Activity,
  Menu,
  Home,
  MapPin,
  Warehouse,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Building2,
  UserCheck,
  PackageSearch,
  TruckIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';
import { signOut } from '@/app/(login)/actions';
import { fetcher } from '@/lib/hooks/useFetcher';

// Define admin user type
interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  userType: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminNavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  badge?: string;
  section: string;
}

const adminNavItems: AdminNavItem[] = [
  // Dashboard
  { 
    href: '/admin', 
    icon: Home, 
    label: 'Dashboard', 
    description: 'Admin overview',
    section: 'Overview'
  },
  { 
    href: '/admin/analytics', 
    icon: BarChart3, 
    label: 'Analytics', 
    description: 'Performance metrics',
    section: 'Overview'
  },

  // Operations
  { 
    href: '/admin/packages', 
    icon: Package, 
    label: 'Packages', 
    description: 'Package management',
    badge: '12',
    section: 'Operations'
  },
  { 
    href: '/admin/shipments', 
    icon: Truck, 
    label: 'Shipments', 
    description: 'Shipment tracking',
    badge: '5',
    section: 'Operations'
  },
  { 
    href: '/admin/warehouse', 
    icon: Warehouse, 
    label: 'Warehouses', 
    description: 'Warehouse operations',
    section: 'Operations'
  },

  // Customer Management
  { 
    href: '/admin/customers', 
    icon: Users, 
    label: 'Customers', 
    description: 'Customer accounts',
    section: 'Customers'
  },
  { 
    href: '/admin/kyc', 
    icon: UserCheck, 
    label: 'KYC Reviews', 
    description: 'Document verification',
    badge: '3',
    section: 'Customers'
  },
  { 
    href: '/admin/companies', 
    icon: Building2, 
    label: 'Companies', 
    description: 'Business accounts',
    section: 'Customers'
  },

  // Financial
  { 
    href: '/admin/invoices', 
    icon: FileText, 
    label: 'Invoices', 
    description: 'Billing management',
    section: 'Financial'
  },
  { 
    href: '/admin/payments', 
    icon: CreditCard, 
    label: 'Payments', 
    description: 'Payment processing',
    section: 'Financial'
  },

  // System
  { 
    href: '/admin/users', 
    icon: Shield, 
    label: 'Staff Users', 
    description: 'User management',
    section: 'System'
  },
  { 
    href: '/admin/settings', 
    icon: Settings, 
    label: 'Settings', 
    description: 'System configuration',
    section: 'System'
  },
  { 
    href: '/admin/activity', 
    icon: Activity, 
    label: 'Activity Logs', 
    description: 'System audit trail',
    section: 'System'
  },
  { 
    href: '/admin/alerts', 
    icon: AlertTriangle, 
    label: 'Alerts', 
    description: 'System notifications',
    badge: '2',
    section: 'System'
  }
];

function AdminSidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  const pathname = usePathname();

  // Group navigation items by section
  const groupedItems = adminNavItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, AdminNavItem[]>);

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 lg:block ${
      isOpen ? 'block' : 'hidden'
    } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="h-full overflow-y-auto">
        {/* Admin Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              <p className="text-xs text-gray-500">Package Forwarding Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                {section}
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} passHref>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={`w-full justify-start h-auto p-3 ${
                          isActive 
                            ? 'bg-orange-50 text-orange-700 border-orange-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className={`h-5 w-5 mr-3 ${
                          isActive ? 'text-orange-600' : 'text-gray-500'
                        }`} />
                        <div className="text-left flex-1">
                          <div className={`text-sm font-medium ${
                            isActive ? 'text-orange-700' : 'text-gray-900'
                          }`}>
                            {item.label}
                          </div>
                          <div className={`text-xs ${
                            isActive ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="ml-2 bg-red-100 text-red-700 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: user, mutate } = useSWR<AdminUser | null>('/api/user', fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 1
  });
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
      await mutate(null, false);
      router.push('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  const userInitials = user?.email
    ?.split('@')[0]
    ?.split('.')
    ?.map((n) => n[0])
    ?.join('')
    ?.toUpperCase()
    ?.slice(0, 2) || 'A';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Breadcrumb or page title could go here */}
          <div className="hidden sm:block">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-900">Dashboard</span>
            </nav>
          </div>
        </div>

        {/* Right side - notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.userType} Admin
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Security
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="mr-2 h-4 w-4" />
                Activity Log
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}