// shared/components/admin/admin-sidebar.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Home, BarChart3, ShoppingCart, Package, ScanLine, UserCog, PackageOpen, 
  Truck, Warehouse, Globe, Users, UserCheck, Building2, FileText, CreditCard, 
  Shield, Settings, Activity, AlertTriangle, ChevronDown 
} from 'lucide-react';

export interface AdminNavItem {
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
  { 
    href: '/admin/personal-shopping', 
    icon: ShoppingCart, 
    label: 'Personal Shopping', 
    description: 'Personal shopping requests', 
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

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
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
    <aside className={`w-[330px] bg-white border-r border-gray-200 lg:block ${
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
                      <Collapsible 
                        key={item.href} 
                        open={isExpanded}
                        onOpenChange={() => toggleExpanded(item.label)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={`w-full justify-start h-auto p-3 ${
                              isActive 
                                ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-3">
                                <item.icon className={`h-5 w-5 ${
                                  isActive ? 'text-orange-600' : 'text-gray-400'
                                }`} />
                                <div className="text-left">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-sm">{item.label}</span>
                                    {item.badge && (
                                      <Badge variant="secondary" className="text-xs">
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                              <ChevronDown className={`h-4 w-4 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`} />
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 mt-1 ml-8">
                          {item.subItems?.map((subItem) => (
                            <Link key={subItem.href} href={subItem.href}>
                              <Button
                                variant={isSubItemActive(subItem.href) ? 'secondary' : 'ghost'}
                                className={`w-full justify-start h-auto p-2 ${
                                  isSubItemActive(subItem.href)
                                    ? 'bg-orange-50 border border-orange-200 text-orange-900'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <subItem.icon className={`h-4 w-4 ${
                                    isSubItemActive(subItem.href) ? 'text-orange-600' : 'text-gray-400'
                                  }`} />
                                  <div className="text-left">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-sm">{subItem.label}</span>
                                      {subItem.badge && (
                                        <Badge variant="secondary" className="text-xs">
                                          {subItem.badge}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {subItem.description}
                                    </p>
                                  </div>
                                </div>
                              </Button>
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={`w-full justify-start h-auto p-3 ${
                          isActive 
                            ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className={`h-5 w-5 ${
                            isActive ? 'text-orange-600' : 'text-gray-400'
                          }`} />
                          <div className="text-left">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{item.label}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
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