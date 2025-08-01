// shared/components/admin/admin-sidebar.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdminNavItem, adminNavItems } from './config';
import { ChevronDown, Shield } from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function AdminSidebar({ 
  isOpen, 
  setIsOpen, 
  isCollapsed, 
  setIsCollapsed 
}: AdminSidebarProps) {
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
    if (isCollapsed) return; // Don't allow expansion when collapsed
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
    <aside 
      className={`
        ${isCollapsed ? 'w-16' : 'w-[330px]'} 
        bg-white border-r border-gray-200 flex-shrink-0 h-full
        lg:block ${isOpen ? 'block' : 'hidden'} 
        lg:relative absolute inset-y-0 left-0 z-40 
        transform transition-all duration-300 ease-in-out 
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Admin Header */}
        <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              {!isCollapsed && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                  <p className="text-xs text-gray-500">Package Forwarding Platform</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto sidebar-scroll ${isCollapsed ? 'px-2' : 'px-4'} py-4`}>
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([section, items]) => (
              <div key={section}>
                {/* Section Header */}
                {!isCollapsed && (
                  <div className="mb-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                      {section}
                    </h3>
                  </div>
                )}

                {/* Navigation Items */}
                <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = isItemActive(item);
                  const isExpanded = expandedItems.includes(item.label);
                  const hasSubItems = item.subItems && item.subItems.length > 0;

                  if (hasSubItems) {
                    return (
                      <Collapsible 
                        key={item.label}
                        open={isExpanded && !isCollapsed}
                        onOpenChange={() => toggleExpanded(item.label)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={`w-full justify-start h-auto ${
                              isCollapsed ? 'p-2' : 'p-2.5'
                            } ${
                              isActive 
                                ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                                : 'hover:bg-gray-50'
                            }`}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <div className={`flex items-center ${
                              isCollapsed ? 'justify-center' : 'justify-between w-full'
                            }`}>
                              <div className={`flex items-center ${
                                isCollapsed ? 'justify-center' : 'space-x-3'
                              }`}>
                                <div className="relative">
                                  <item.icon className={`h-4 w-4 ${
                                    isActive ? 'text-orange-600' : 'text-gray-400'
                                  }`} />
                                  {/* Badge for collapsed state */}
                                  {isCollapsed && item.badge && (
                                    <Badge 
                                      variant="destructive" 
                                      className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                {!isCollapsed && (
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
                                )}
                              </div>
                              {!isCollapsed && (
                                <ChevronDown className={`h-3 w-3 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`} />
                              )}
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-0.5 mt-1 ml-4">
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
                                <div className="flex items-center space-x-2">
                                  <subItem.icon className={`h-4 w-4 ${
                                    isSubItemActive(subItem.href) ? 'text-orange-600' : 'text-gray-400'
                                  }`} />
                                  <div className="text-left">
                                    <span className="font-medium text-sm">{subItem.label}</span>
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
                  } else {
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={`w-full justify-start h-auto ${
                            isCollapsed ? 'p-2' : 'p-2.5'
                          } ${
                            isActive 
                              ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                              : 'hover:bg-gray-50'
                          }`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <div className={`flex items-center ${
                            isCollapsed ? 'justify-center' : 'space-x-3'
                          }`}>
                            <div className="relative">
                              <item.icon className={`h-4 w-4 ${
                                isActive ? 'text-orange-600' : 'text-gray-400'
                              }`} />
                              {/* Badge for collapsed state */}
                              {isCollapsed && item.badge && (
                                <Badge 
                                  variant="destructive" 
                                  className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            {!isCollapsed && (
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
                            )}
                          </div>
                        </Button>
                      </Link>
                    );
                  }
                })}
              </div>
            </div>
          ))}
          </div>
        </nav>
      </div>
    </aside>
  );
}