// app/admin/packages/pre-receiving/page.tsx
'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, Scan, History, CheckCircle, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useWarehouses } from '@/features/warehouses/hooks/use-warehouses-query';
import { useCouriers } from '@/features/settings/hooks/use-settings-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomerSearch } from '@/features/packages/components/assignment/customer-search';
import { useIncomingShipments, useAssignItems, useIncomingShipmentItems } from '@/features/packages/hooks/use-packages-query';
import { UnassignedItemsTable } from '@/features/packages/components/assignment/unassigned-items-table';
import { useCustomers } from '@/features/customers/hooks/use-customers-query';
import { IncomingShipmentItem } from '@/features/packages/types/package.types';
import { BulkScanForm } from '@/features/packages/components/pre-receiving/bulk-scan-form';
import { toast } from 'sonner';
import { Customer } from '@/features/customers/types/customer.types';

export default function PreReceivingPage() {
  const [activeTab, setActiveTab] = useState('scan');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
    const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  
  // Data fetching
  const { data: shipmentsResponse } = useIncomingShipments({
    status: ['pending', 'scanning', 'scanned'] as any,
    page: 1,
    limit: 20
  });
  
  // Fetch unassigned items separately
  const { data: shipmentItemsResponse } = useIncomingShipmentItems({
    assignmentStatus: 'unassigned',
    limit: 100
  });
  
  const { data: warehousesResponse } = useWarehouses({ status: 'active' });
  const { data: couriersResponse } = useCouriers({ isActive: true });
  const { data: customersResponse } = useCustomers({ 
    search: customerSearchQuery,
    limit: 5
  });
  
  const shipments = shipmentsResponse?.data || [];
  const warehouses = warehousesResponse?.data || [];
  const couriers = couriersResponse?.data || [];
  const customers = customersResponse?.data || [];

  // Get unassigned items directly from the items endpoint
  const unassignedItems = shipmentItemsResponse?.data || [];

  const assignItems = useAssignItems();

  const handleShipmentCreated = (shipmentId: string) => {
    // Switch to history tab to show the created shipment
    setActiveTab('history');
  };

  const handleAssignItems = async () => {
    if (!selectedCustomer || selectedItems.size === 0) return;
    try {
      await assignItems.mutateAsync({assignments: Array.from(selectedItems).map(itemId => ({ itemId })),
      customerProfileId: selectedCustomer.id});
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to assign items:', error);
    }
  };

  
    // Use useCallback to prevent the search function from being recreated on every render
    const handleCustomerSearch = useCallback(async (query: string) => {
      if (query.length < 2) {
        setCustomerSearchResults([]);
        return;
      }
  
      setCustomerSearchLoading(true);
      try {
        const response = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(query)}&limit=10`);
        if (!response.ok) throw new Error('Failed to search customers');
        
        const data = await response.json();
        // Handle both possible response formats
        const customers = data.customers || data.data || [];
        setCustomerSearchResults(customers);
      } catch (error) {
        console.error('Error searching customers:', error);
        toast.error('Failed to search customers');
        setCustomerSearchResults([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, []); 
    
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/packages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packages
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Package Assignment</h1>
            <p className="text-gray-600">Link scanned tracking numbers to customer profiles</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/packages/pre-receiving">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Pre-Receiving
            </Button>
          </Link>
          <Link href="/admin/packages/receiving">
            <Button variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Receiving
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px] mb-4">
          <TabsTrigger value="scan">
            <Scan className="mr-2 h-4 w-4" />
            Scan Items
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Shipment History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Scan Items</CardTitle>
            </CardHeader>
            <CardContent>
              <BulkScanForm 
                warehouses={warehouses} 
                couriers={couriers}
                onShipmentCreated={handleShipmentCreated}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unassigned Items</p>
                    <p className="text-2xl font-bold">{unassignedItems.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Selected Items</p>
                    <p className="text-2xl font-bold">{selectedItems.size}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ready to Assign</p>
                    <p className="text-2xl font-bold">
                      {selectedCustomer && selectedItems.size > 0 ? selectedItems.size : 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left: Unassigned Items */}
            <div className="col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Unassigned Items ({unassignedItems.length})</span>
                    {selectedItems.size > 0 && (
                      <Badge variant="secondary">
                        {selectedItems.size} selected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {unassignedItems.length > 0 ? (
                    <UnassignedItemsTable
                      items={unassignedItems}
                      selectedItems={selectedItems}
                      onSelectionChange={setSelectedItems}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Unassigned Items
                      </h3>
                      <p className="text-gray-600 mb-4">
                        All scanned items have been assigned to customers.
                      </p>
                      <Link href="/admin/packages/pre-receiving">
                        <Button>
                          <Package className="mr-2 h-4 w-4" />
                          Go to Pre-Receiving
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Customer Assignment */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerSearch
                    selectedCustomer={selectedCustomer}
                    onCustomerSelect={setSelectedCustomer}
                    onSearchChange={handleCustomerSearch}
                    searchResults={customerSearchResults}
                    isLoading={customerSearchLoading}
                  />
                </CardContent>
              </Card>

              {/* Assignment Actions */}
              {selectedItems.size > 0 && selectedCustomer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assignment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You are about to assign <strong>{selectedItems.size}</strong> item
                        {selectedItems.size !== 1 ? 's' : ''} to{' '}
                        <strong>{selectedCustomer.firstName} {selectedCustomer.lastName}</strong>.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={handleAssignItems}
                      disabled={assignItems.isPending}
                      className="w-full"
                    >
                      {assignItems.isPending ? (
                        <>
                          <Package className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Assign {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/admin/customers/create">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Add New Customer
                    </Button>
                  </Link>
                  <Link href="/admin/packages/receiving">
                    <Button variant="outline" className="w-full justify-start">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Go to Receiving
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}