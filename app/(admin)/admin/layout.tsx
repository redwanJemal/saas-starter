// app/(admin)/admin/layout.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Package, Users, Truck, FileText, Settings, Shield, Activity, Menu, Home, MapPin, Warehouse, CreditCard, AlertTriangle, BarChart3, Bell, LogOut, User, ChevronDown, Building2, UserCheck, PackageSearch, TruckIcon, Scan, UserCog, PackageOpen, PackagePlus, ScanLine, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import useSWR from 'swr';
import { User as UserType } from '@/lib/db/schema';
import { signOut } from '@/app/(login)/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AdminNavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  badge?: string;
  section: string;
  subItems?: AdminNavItem[];
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

  // Operations - Receiving Workflow
  {
    href: '/admin/packages',
    icon: Package,
    label: 'Package Operations',
    description: 'Complete package workflow',
    badge: '12',
    section: 'Operations',
    subItems: [
      {
        href: '/admin/packages/pre-receiving',
        icon: ScanLine,
        label: 'Pre-Receiving',
        description: 'Bulk scan tracking numbers',
        section: 'Operations'
      },
      {
        href: '/admin/packages/assignment',
        icon: UserCog,
        label: 'Account Assignment',
        description: 'Link packages to customers',
        badge: '8',
        section: 'Operations'
      },
      {
        href: '/admin/packages/receiving',
        icon: PackageOpen,
        label: 'Package Receiving',
        description: 'Complete package details',
        section: 'Operations'
      },
      {
        href: '/admin/packages',
        icon: Package,
        label: 'All Packages',
        description: 'View all packages',
        section: 'Operations'
      }
    ]
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
    href: '/admin/warehouses',
    icon: Warehouse,
    label: 'Warehouses',
    description: 'Warehouse operations',
    section: 'Operations'
  },
  {
    href: '/admin/shipping/zones',
    icon: Globe,
    label: 'Shipping Zones',
    description: 'Manage shipping zones',
    section: 'Operations'
  },
  {
    href: '/admin/shipping/rates',
    icon: Truck,
    label: 'Shipping Rates',
    description: 'Manage shipping rates',
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
  const [expandedItems, setExpandedItems] = useState<string[]>(['Package Operations']);

  // Group navigation items by section
  const groupedItems = adminNavItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, AdminNavItem[]>);

  const toggleExpanded = (itemLabel: string) => {
    setExpandedItems(prev => 
      prev.includes(itemLabel) 
        ? prev.filter(item => item !== itemLabel)
        : [...prev, itemLabel]
    );
  };

  const isItemActive = (item: AdminNavItem): boolean => {
    if (pathname === item.href) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => pathname === subItem.href);
    }
    return false;
  };

  const isSubItemActive = (href: string): boolean => {
    return pathname === href;
  };

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
                  const isActive = isItemActive(item);
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedItems.includes(item.label);

                  if (hasSubItems) {
                    return (
                      <Collapsible key={item.href} open={isExpanded} onOpenChange={() => toggleExpanded(item.label)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={`w-full justify-start h-auto p-3 ${
                              isActive ? 'bg-orange-50 text-orange-700 border-orange-200' : 'hover:bg-gray-50'
                            }`}
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
                              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 text-xs">
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${
                              isExpanded ? 'transform rotate-180' : ''
                            }`} />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 mt-1 ml-6">
                          {item.subItems?.map((subItem) => {
                            const isSubActive = isSubItemActive(subItem.href);
                            return (
                              <Link key={subItem.href} href={subItem.href} passHref>
                                <Button
                                  variant={isSubActive ? 'secondary' : 'ghost'}
                                  className={`w-full justify-start h-auto p-2 text-sm ${
                                    isSubActive ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => setIsOpen(false)}
                                >
                                  <subItem.icon className={`h-4 w-4 mr-2 ${
                                    isSubActive ? 'text-orange-600' : 'text-gray-500'
                                  }`} />
                                  <div className="text-left flex-1">
                                    <div className={`text-xs font-medium ${
                                      isSubActive ? 'text-orange-700' : 'text-gray-700'
                                    }`}>
                                      {subItem.label}
                                    </div>
                                    <div className={`text-xs ${
                                      isSubActive ? 'text-orange-500' : 'text-gray-500'
                                    }`}>
                                      {subItem.description}
                                    </div>
                                  </div>
                                  {subItem.badge && (
                                    <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700 text-xs">
                                      {subItem.badge}
                                    </Badge>
                                  )}
                                </Button>
                              </Link>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href} passHref>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={`w-full justify-start h-auto p-3 ${
                          isActive ? 'bg-orange-50 text-orange-700 border-orange-200' : 'hover:bg-gray-50'
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
                          <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 text-xs">
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
  const { data: user } = useSWR<UserType>('/api/user', fetcher);

  async function handleSignOut() {
    await signOut();
  }

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
                  <AvatarImage src={user?.avatarUrl || ''} alt={user?.email || ''} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
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