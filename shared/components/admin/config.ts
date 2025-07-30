import { 
    Home, BarChart3, ShoppingCart, Package, ScanLine, UserCog, PackageOpen, 
    Truck, Warehouse, Globe, Users, UserCheck, Building2, FileText, CreditCard, 
    Shield, Settings, Activity, AlertTriangle
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
  
  export const adminNavItems: AdminNavItem[] = [
    // Dashboard
    { href: '/admin', icon: Home, label: 'Dashboard', description: 'Admin overview', section: 'Overview' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', description: 'Performance metrics', section: 'Overview' },
    { href: '/admin/personal-shopping', icon: ShoppingCart, label: 'Personal Shopping', description: 'Personal shopping requests', section: 'Overview' },
    
    // Operations - Receiving Workflow
    { 
      href: '/admin/packages', 
      icon: Package, 
      label: 'Package Operations', 
      description: 'Complete package workflow', 
      badge: '12', 
      section: 'Operations',
      subItems: [
        { href: '/admin/packages/pre-receiving', icon: ScanLine, label: 'Pre-Receiving', description: 'Bulk scan tracking numbers', section: 'Operations' },
        { href: '/admin/packages/assignment', icon: UserCog, label: 'Account Assignment', description: 'Link packages to customers', badge: '8', section: 'Operations' },
        { href: '/admin/packages/receiving', icon: PackageOpen, label: 'Package Receiving', description: 'Complete package details', section: 'Operations' },
        { href: '/admin/packages', icon: Package, label: 'All Packages', description: 'View all packages', section: 'Operations' }
      ]
    },
    { href: '/admin/shipments', icon: Truck, label: 'Shipments', description: 'Shipment tracking', badge: '5', section: 'Operations' },
    { href: '/admin/warehouses', icon: Warehouse, label: 'Warehouses', description: 'Warehouse operations', section: 'Operations' },
    { href: '/admin/shipping/zones', icon: Globe, label: 'Shipping Zones', description: 'Manage shipping zones', section: 'Operations' },
    { href: '/admin/shipping/rates', icon: Truck, label: 'Shipping Rates', description: 'Manage shipping rates', section: 'Operations' },
    
    // Customer Management
    { href: '/admin/customers', icon: Users, label: 'Customers', description: 'Customer accounts', section: 'Customers' },
    { href: '/admin/kyc', icon: UserCheck, label: 'KYC Reviews', description: 'Document verification', badge: '3', section: 'Customers' },
    { href: '/admin/companies', icon: Building2, label: 'Companies', description: 'Business accounts', section: 'Customers' },
    
    // Financial
    { href: '/admin/invoices', icon: FileText, label: 'Invoices', description: 'Billing management', section: 'Financial' },
    { href: '/admin/payments', icon: CreditCard, label: 'Payments', description: 'Payment processing', section: 'Financial' },
    
    // System
    { href: '/admin/users', icon: Shield, label: 'Staff Users', description: 'User management', section: 'System' },
    { href: '/admin/settings', icon: Settings, label: 'Settings', description: 'System configuration', section: 'System' },
    { href: '/admin/activity', icon: Activity, label: 'Activity Logs', description: 'System audit trail', section: 'System' },
    { href: '/admin/alerts', icon: AlertTriangle, label: 'Alerts', description: 'System notifications', badge: '2', section: 'System' }
  ];