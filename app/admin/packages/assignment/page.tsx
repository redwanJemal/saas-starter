// app/admin/packages/assignment/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Package, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { UnassignedItemsTable } from '@/features/packages/components/assignment/unassigned-items-table';
import { CustomerSearch } from '@/features/packages/components/assignment/customer-search';
import { useIncomingShipmentItems, useAssignItems } from '@/features/packages/hooks/use-packages-query';
import { useCustomers } from '@/features/customers/hooks/use-customers-query';
import { toast } from 'sonner';

export default function PackageAssignmentPage() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Data fetching
  const { data: itemsResponse, refetch: refetchItems } = useIncomingShipmentItems({
    assignmentStatus: 'unassigned',
    page: 1,
    limit: 50
  });

  const { data: customersResponse } = useCustomers({
    search: customerSearchQuery,
    limit: 10
  });

  const assignItems = useAssignItems();

  const unassignedItems = itemsResponse?.data || [];
  const customers = customersResponse?.data || [];

  const handleAssignItems = async () => {
    if (!selectedCustomer || selectedItems.size === 0) {
      toast.error('Please select items and a customer');
      return;
    }

    try {
      const assignments = Array.from(selectedItems).map(itemId => ({
        itemId,
        customerProfileId: selectedCustomer.id
      }));

      await assignItems.mutateAsync({ assignments });

      // Reset selections
      setSelectedItems(new Set());
      setSelectedCustomer(null);

      // Refetch data
      await refetchItems();

      toast.success(
        `Successfully assigned ${selectedItems.size} items to ${selectedCustomer.firstName} ${selectedCustomer.lastName}`
      );
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('Failed to assign items');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/packages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packages
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6" />
              Package Assignment
            </h1>
            <p className="text-gray-600">
              Assign unassigned packages to customers
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Unassigned Items</p>
                <p className="text-2xl font-bold">{unassignedItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Selected Items</p>
                <p className="text-2xl font-bold">{selectedItems.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Available Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Unassigned Items</span>
                <Badge variant="outline">
                  {selectedItems.size} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UnassignedItemsTable
                items={unassignedItems}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
              />
            </CardContent>
          </Card>
        </div>

        {/* Customer Selection */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Select Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Search */}
              <div>
                <Input
                  placeholder="Search customers..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                />
              </div>

              {/* Customer List */}
              <CustomerSearch
                selectedCustomer={selectedCustomer}
                onCustomerSelect={setSelectedCustomer}
                onSearchChange={setCustomerSearchQuery}
              />

              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedCustomer.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {selectedCustomer.suiteCode}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Assignment Button */}
              <Button
                onClick={handleAssignItems}
                disabled={
                  assignItems.isPending || selectedItems.size === 0 || !selectedCustomer
                }
                className="mt-4"
              >
                {assignItems.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Assign Items
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}