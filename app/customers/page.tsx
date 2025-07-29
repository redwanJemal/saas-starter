'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CustomerTable } from '@/features/customers/components/customer-table';
import { CustomerFilters } from '@/features/customers/types/customer.types';
import { Plus, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({});

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer accounts and track their activity
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              All registered customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,051</div>
            <p className="text-xs text-muted-foreground">
              From all customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Packages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.0</div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            View and manage all customers in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => handleStatusFilter('all')}>
                All
              </TabsTrigger>
              <TabsTrigger value="active" onClick={() => handleStatusFilter('active')}>
                Active
              </TabsTrigger>
              <TabsTrigger value="inactive" onClick={() => handleStatusFilter('inactive')}>
                Inactive
              </TabsTrigger>
              <TabsTrigger value="suspended" onClick={() => handleStatusFilter('suspended')}>
                Suspended
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <CustomerTable
                filters={filters}
                onCustomerClick={(customer) => console.log('Customer clicked:', customer)}
              />
            </TabsContent>
            
            <TabsContent value="active" className="space-y-4">
              <CustomerTable
                filters={filters}
                onCustomerClick={(customer) => console.log('Customer clicked:', customer)}
              />
            </TabsContent>
            
            <TabsContent value="inactive" className="space-y-4">
              <CustomerTable
                filters={filters}
                onCustomerClick={(customer) => console.log('Customer clicked:', customer)}
              />
            </TabsContent>
            
            <TabsContent value="suspended" className="space-y-4">
              <CustomerTable
                filters={filters}
                onCustomerClick={(customer) => console.log('Customer clicked:', customer)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
