// shared/components/admin/admin-layout.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, Bell, Search, User, Settings, LogOut, Shield } from 'lucide-react';
import { AdminSidebar } from './admin-sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-[330px]">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
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
                    <p className="text-sm text-gray-500">You have 3 unread notifications</p>
                  </div>
                  <div className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-2 rounded-lg bg-orange-50">
                        <div className="bg-orange-100 p-1 rounded-full">
                          <Shield className="h-3 w-3 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">KYC Review Required</p>
                          <p className="text-xs text-gray-500">3 customers pending verification</p>
                          <p className="text-xs text-gray-400">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="bg-blue-100 p-1 rounded-full">
                          <Bell className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New Package Received</p>
                          <p className="text-xs text-gray-500">Package #PKG-2024-001 needs assignment</p>
                          <p className="text-xs text-gray-400">15 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="bg-green-100 p-1 rounded-full">
                          <User className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New Customer Registration</p>
                          <p className="text-xs text-gray-500">john.doe@example.com has registered</p>
                          <p className="text-xs text-gray-400">1 hour ago</p>
                        </div>
                      </div>
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
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">Admin User</p>
                      <p className="text-xs text-gray-500">System Administrator</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-3 border-b">
                    <p className="font-medium">Admin User</p>
                    <p className="text-sm text-gray-500">admin@example.com</p>
                    <Badge variant="outline" className="mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      Administrator
                    </Badge>
                  </div>
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}