// app/(dashboard)/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Settings, 
  Shield, 
  Activity, 
  Menu,
  Home,
  MapPin,
  FileText,
  Truck
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { 
      href: '/dashboard', 
      icon: Home, 
      label: 'Overview',
      description: 'Account overview and stats'
    },
    { 
      href: '/dashboard/packages', 
      icon: Package, 
      label: 'Packages',
      description: 'Your received packages'
    },
    { 
      href: '/dashboard/shipments', 
      icon: Truck, 
      label: 'Shipments',
      description: 'Track your shipments'
    },
    { 
      href: '/dashboard/addresses', 
      icon: MapPin, 
      label: 'Addresses',
      description: 'Manage shipping addresses'
    },
    { 
      href: '/dashboard/invoices', 
      icon: FileText, 
      label: 'Invoices',
      description: 'Billing and invoices'
    },
    { 
      href: '/dashboard/general', 
      icon: Settings, 
      label: 'General',
      description: 'Account settings'
    },
    { 
      href: '/dashboard/security', 
      icon: Shield, 
      label: 'Security',
      description: 'Password and security'
    },
    { 
      href: '/dashboard/activity', 
      icon: Activity, 
      label: 'Activity',
      description: 'Account activity log'
    }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Dashboard</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} passHref>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={`shadow-none w-full justify-start h-auto p-3 ${
                        isActive ? 'bg-orange-50 text-orange-700 border-orange-200' : ''
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className={`h-5 w-5 mr-3 ${
                        isActive ? 'text-orange-600' : 'text-gray-500'
                      }`} />
                      <div className="text-left">
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
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}