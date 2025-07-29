// app/(admin)/admin/packages/assignment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  Search, 
  Users, 
  UserCog,
  Loader2,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';

interface UnassignedItem {
  id: string;
  trackingNumber: string;
  courierTrackingUrl?: string;
  scannedAt: string;
  assignmentStatus: string;
  batchReference: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  courierId?: string;
  courierName?: string;
  courierCode?: string;
  arrivalDate?: string;
}

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Courier {
  id: string;
  name: string;
  code: string;
}

export default function PackageAssignmentPage() {
  // States
  const [unassignedItems, setUnassignedItems] = useState<UnassignedItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  
  // Selection states
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
  // Search and pagination
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUnassignedItems();
    fetchWarehouses();
    fetchCouriers();
  }, [search, selectedWarehouse, selectedCourier, currentPage]);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      fetchCustomers();
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  const fetchUnassignedItems = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(search && { search }),
        ...(selectedWarehouse && { warehouseId: selectedWarehouse }),
        ...(selectedCourier && { courierId: selectedCourier })
      });

      const response = await fetch(`/api/admin/assign-packages/bulk?${params}`);
      if (!response.ok) throw new Error('Failed to fetch unassigned items');
      
      const data = await response.json();
      setUnassignedItems(data.unassignedItems);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching unassigned items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams({
        search: customerSearch,
        limit: '20'
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const data = await response.json();
      setCustomers(data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/admin/warehouses?limit=100');
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      
      const data = await response.json();
      setWarehouses(data.warehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchCouriers = async () => {
    try {
      const response = await fetch('/api/admin/master-data/couriers?limit=100');
      if (!response.ok) throw new Error('Failed to fetch couriers');
      
      const data = await response.json();
      setCouriers(data.couriers);
    } catch (error) {
      console.error('Error fetching couriers:', error);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
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

  const handleBulkAssignment = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to assign');
      return;
    }

    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch('/api/admin/assign-packages/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: Array.from(selectedItems),
          customerProfileId: selectedCustomer
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign packages');
      }

      const result = await response.json();
      alert(`Successfully assigned ${selectedItems.size} items to ${result.customer.name}`);
      
      // Reset selections and refresh data
      setSelectedItems(new Set());
      setSelectedCustomer('');
      setCustomerSearch('');
      fetchUnassignedItems();
    } catch (error) {
      console.error('Error assigning packages:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign packages');
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Package Assignment</h1>
        <p className="text-gray-600">
          Assign scanned tracking numbers to customer accounts. Items must be assigned before packages can be created.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Tracking Numbers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search tracking numbers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="warehouse">Warehouse</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="All warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="courier">Courier</Label>
              <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                <SelectTrigger>
                  <SelectValue placeholder="All couriers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All couriers</SelectItem>
                  {couriers.map((courier) => (
                    <SelectItem key={courier.id} value={courier.id}>
                      {courier.name} ({courier.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer-search">Search Customers</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="customer-search"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Unassigned Items List */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Unassigned Items
                  <Badge variant="secondary">{unassignedItems.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedItems.size === unassignedItems.length && unassignedItems.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">Select All</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading unassigned items...</span>
                </div>
              ) : unassignedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No unassigned items found</p>
                  <p className="text-sm">All scanned items have been assigned to customers</p>
                  <Link href="/admin/packages/pre-receiving">
                    <Button variant="outline" className="mt-4">
                      Go to Pre-Receiving
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {unassignedItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-lg transition-colors ${
                        selectedItems.has(item.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-sm">
                                {item.trackingNumber}
                                {item.courierTrackingUrl && (
                                  <Link 
                                    href={item.courierTrackingUrl} 
                                    target="_blank"
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                  >
                                    <ExternalLink className="h-3 w-3 inline" />
                                  </Link>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.courierName && `${item.courierName} • `}
                                Scanned: {formatDate(item.scannedAt)}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-orange-700 border-orange-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unassigned
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            Batch: {item.batchReference} • {item.warehouseName}
                            {item.arrivalDate && ` • Arrived: ${new Date(item.arrivalDate).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignment Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Assign to Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Selection Summary */}
                {selectedItems.size > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">
                      {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {Array.from(selectedItems).slice(0, 3).map(itemId => {
                        const item = unassignedItems.find(i => i.id === itemId);
                        return item?.trackingNumber;
                      }).join(', ')}
                      {selectedItems.size > 3 && ` +${selectedItems.size - 3} more`}
                    </div>
                  </div>
                )}

                {/* Customer Selection */}
                {customers.length > 0 && (
                  <div>
                    <Label>Select Customer</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.firstName} {customer.lastName}</span>
                              <span className="text-xs text-gray-500">
                                {customer.customerId} • {customer.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Selected Customer Summary */}
                {selectedCustomerObj && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-900">
                      {selectedCustomerObj.firstName} {selectedCustomerObj.lastName}
                    </div>
                    <div className="text-xs text-green-700">
                      {selectedCustomerObj.customerId} • {selectedCustomerObj.email}
                    </div>
                  </div>
                )}

                {/* Assignment Action */}
                <Button 
                  onClick={handleBulkAssignment}
                  disabled={assigning || selectedItems.size === 0 || !selectedCustomer}
                  className="w-full"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Assign {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>

                {/* Help Text */}
                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                  <strong>Tip:</strong> Search for customers by typing their name, email, or customer ID. 
                  Select multiple items to assign them all to the same customer account.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/packages/pre-receiving">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    Pre-Receiving
                  </Button>
                </Link>
                <Link href="/admin/packages/receiving">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Package Receiving
                  </Button>
                </Link>
                <Link href="/admin/customers/create">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Add New Customer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}