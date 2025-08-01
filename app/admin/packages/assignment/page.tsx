// app/admin/packages/assignment/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Users, Package, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { CustomerSearch } from '@/features/packages/components/assignment/customer-search';
import { toast } from 'sonner';
import { Customer } from '@/features/customers/types/customer.types';
import { useAssignItems } from '@/features/packages/hooks/use-packages-query';

interface UnassignedItem {
  id: string;
  trackingNumber: string;
  courierName?: string;
  scannedAt: string;
  batchReference: string;
  warehouseName: string;
}

export default function PackageAssignmentPage() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [unassignedItems, setUnassignedItems] = useState<UnassignedItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { mutate: assignItems, isPending: isAssigning } = useAssignItems();

  // Fetch unassigned items on component mount
  useEffect(() => {
    fetchUnassignedItems();
  }, []);

  const fetchUnassignedItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/incoming-shipment-items?assignmentStatus=unassigned&limit=50');
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      setUnassignedItems(data.data || []);
    } catch (error) {
      console.error('Error fetching unassigned items:', error);
      toast.error('Failed to load unassigned items');
    } finally {
      setLoading(false);
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

  const handleItemSelection = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(unassignedItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleAssignItems = () => {
    if (selectedItems.size === 0 || !selectedCustomer) {
      toast.error('Please select items and a customer');
      return;
    }

    assignItems(
      {
        assignments: Array.from(selectedItems).map(itemId => ({ itemId })),
        customerProfileId: selectedCustomer.id
      },
      {
        onSuccess: () => {
          // Reset selections and refresh data
          setSelectedItems(new Set());
          setSelectedCustomer(null);
          fetchUnassignedItems();
        },
        onError: (error) => {
          console.error('Error assigning packages:', error);
        }
      }
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/packages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Packages
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Package Assignment</h1>
        <p className="text-gray-600">
          Assign scanned tracking numbers to customer accounts. Items must be assigned before packages can be created.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
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
                <p className="text-sm font-medium">Customer Selected</p>
                <p className="text-2xl font-bold">{selectedCustomer ? '1' : '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Items List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Unassigned Items
                  <Badge variant="secondary">{unassignedItems.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === unassignedItems.length && unassignedItems.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading unassigned items...</p>
                </div>
              ) : unassignedItems.length > 0 ? (
                <div className="space-y-2">
                  {unassignedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.trackingNumber}</div>
                        <div className="text-sm text-gray-500">
                          {item.courierName} • {item.warehouseName}
                        </div>
                        <div className="text-xs text-gray-400">
                          Batch: {item.batchReference} • Scanned: {new Date(item.scannedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Unassigned Items</h3>
                  <p className="text-gray-600 mb-4">All scanned items have been assigned to customers.</p>
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

        {/* Customer Assignment Panel */}
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

          {/* Assignment Summary */}
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
                    <strong>{selectedCustomer.name}</strong> ({selectedCustomer.customerId}).
                  </AlertDescription>
                </Alert>
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleAssignItems} 
                    disabled={selectedItems.size === 0 || !selectedCustomer || isAssigning}
                    className="min-w-32"
                  >
                    {isAssigning ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      `Assign ${selectedItems.size} Items`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">How to Assign Items</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Select items from the left panel</li>
                <li>2. Search and select a customer</li>
                <li>3. Click "Assign Items" to complete</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}