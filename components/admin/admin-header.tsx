'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, Bell, Search, Settings, LogOut, PanelLeft, ChevronLeft } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

interface AdminHeaderProps {
  title?: string;
  description?: string;
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminHeader({ 
  title, 
  description, 
  onMenuClick, 
  isSidebarCollapsed, 
  onToggleCollapse 
}: AdminHeaderProps) {
  const { user, logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const getDisplayName = (firstName?: string | null, lastName?: string | null) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    return 'Admin User';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop Collapsible Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden lg:flex h-8 w-8 p-0"
            onClick={onToggleCollapse}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Page Title */}
          <div>
            {title && (
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            )}
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <Button variant="ghost" size="sm">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b">
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-gray-500">3 unread notifications</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-3 hover:bg-gray-50 border-b">
                  <p className="text-sm font-medium">New package received</p>
                  <p className="text-xs text-gray-500">Package #PKG-2024-001 assigned to customer</p>
                  <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                </div>
                <div className="p-3 hover:bg-gray-50 border-b">
                  <p className="text-sm font-medium">KYC document submitted</p>
                  <p className="text-xs text-gray-500">Customer John Doe uploaded new documents</p>
                  <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                </div>
                <div className="p-3 hover:bg-gray-50">
                  <p className="text-sm font-medium">Payment processed</p>
                  <p className="text-xs text-gray-500">Invoice #INV-2024-001 paid successfully</p>
                  <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                </div>
              </div>
              <div className="p-3 border-t">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/api/placeholder/32/32" alt="Admin" />
                  <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{getDisplayName(user?.firstName, user?.lastName)}</p>
                  <p className="text-xs text-gray-500">
                    {user?.userType === 'admin' ? 'System Administrator' : 'Admin User'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}