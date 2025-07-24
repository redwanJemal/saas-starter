// app/(admin)/admin/packages/receiving/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  Search, 
  Users, 
  Truck, 
  Calendar,
  Scale,
  DollarSign,
  AlertTriangle,
  Shield,
  FileSignature,
  Ban,
  Loader2,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface AssignedItem {
  id: string;
  trackingNumber: string;
  courierTrackingUrl?: string;
  assignedAt: string;
  scannedAt: string;
  customerProfileId: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  batchReference: string;
  arrivalDate?: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  courierId?: string;
  courierName?: string;
  courierCode?: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

export default function PackageReceivingPage() {
  // States
  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssignedItem | null>(null);
  
  // Search and pagination
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Package form data
  const [packageForm, setPackageForm] = useState({
    description: '',
    weightActualKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    estimatedValue: '',
    estimatedValueCurrency: 'USD',
    warehouseNotes: '',
    specialInstructions: '',
    isFragile: false,
    isHighValue: false,
    requiresAdultSignature: false,
    isRestricted: false
  });

  useEffect(() => {
    fetchAssignedItems();
    fetchCurrencies();
    fetchWarehouses();
  }, [search, selectedWarehouse, currentPage]);

  const fetchAssignedItems = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
        ...(selectedWarehouse && { warehouseId: selectedWarehouse })
      });

      const response = await fetch(`/api/admin/packages/assigned-items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch assigned items');
      
      const data = await response.json();
      setAssignedItems(data.assignedItems);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching assigned items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await fetch('/api/admin/master-data/currencies?limit=100');
      if (!response.ok) throw new Error('Failed to fetch currencies');
      
      const data = await response.json();
      setCurrencies(data.currencies);
    } catch (error) {
      console.error('Error fetching currencies:', error);
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

  const handleCreatePackage = async (item: AssignedItem) => {
    if (!packageForm.weightActualKg) {
      alert('Weight is required to create a package');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incomingShipmentItemId: item.id,
          ...packageForm,
          weightActualKg: parseFloat(packageForm.weightActualKg),
          lengthCm: packageForm.lengthCm ? parseFloat(packageForm.lengthCm) : null,
          widthCm: packageForm.widthCm ? parseFloat(packageForm.widthCm) : null,
          heightCm: packageForm.heightCm ? parseFloat(packageForm.heightCm) : null,
          estimatedValue: packageForm.estimatedValue ? parseFloat(packageForm.estimatedValue) : 0,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create package');
      }

      const result = await response.json();
      alert('Package created successfully!');
      
      // Reset form and refresh data
      setSelectedItem(null);
      setPackageForm({
        description: '',
        weightActualKg: '',
        lengthCm: '',
        widthCm: '',
        heightCm: '',
        estimatedValue: '',
        estimatedValueCurrency: 'USD',
        warehouseNotes: '',
        specialInstructions: '',
        isFragile: false,
        isHighValue: false,
        requiresAdultSignature: false,
        isRestricted: false
      });
      
      fetchAssignedItems();
    } catch (error) {
      console.error('Error creating package:', error);
      alert(error instanceof Error ? error.message : 'Failed to create package');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Package Receiving</h1>
        <p className="text-gray-600">
          Complete package details for assigned items. Items must be assigned to customers before packages can be created.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by tracking number, customer name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-64">
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
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Assigned Items List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Assigned Items Ready for Receiving
                <Badge variant="secondary">{assignedItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading assigned items...</span>
                </div>
              ) : assignedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No assigned items ready for receiving</p>
                  <p className="text-sm">Items must be assigned to customers first</p>
                  <Link href="/admin/packages/assignment">
                    <Button variant="outline" className="mt-4">
                      Go to Assignment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {assignedItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedItem?.id === item.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">
                            {item.trackingNumber}
                            {item.courierTrackingUrl && (
                              <Link 
                                href={item.courierTrackingUrl} 
                                target="_blank"
                                className="ml-2 text-blue-600 hover:text-blue-800"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3 inline" />
                              </Link>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.customerName} ({item.customerId})
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.courierName && `${item.courierName} • `}
                            Assigned: {formatDate(item.assignedAt)}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Assigned
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        Batch: {item.batchReference} • {item.warehouseName}
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

        {/* Package Creation Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Create Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedItem ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an assigned item to create a package</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Item Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Selected Item</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Tracking:</strong> {selectedItem.trackingNumber}</div>
                      <div><strong>Customer:</strong> {selectedItem.customerName} ({selectedItem.customerId})</div>
                      <div><strong>Courier:</strong> {selectedItem.courierName || 'N/A'}</div>
                      <div><strong>Warehouse:</strong> {selectedItem.warehouseName}</div>
                    </div>
                  </div>

                  {/* Package Form */}
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Package description (e.g., iPhone 15, Nike shoes...)"
                        value={packageForm.description}
                        onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    {/* Weight - Required */}
                    <div>
                      <Label htmlFor="weight">Weight (kg) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={packageForm.weightActualKg}
                        onChange={(e) => setPackageForm(prev => ({ ...prev, weightActualKg: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Dimensions */}
                    <div>
                      <Label>Dimensions (cm)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Length"
                          value={packageForm.lengthCm}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, lengthCm: e.target.value }))}
                        />
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Width"
                          value={packageForm.widthCm}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, widthCm: e.target.value }))}
                        />
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Height"
                          value={packageForm.heightCm}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, heightCm: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Estimated Value */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="value">Estimated Value</Label>
                        <Input
                          id="value"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={packageForm.estimatedValue}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, estimatedValue: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select 
                          value={packageForm.estimatedValueCurrency} 
                          onValueChange={(value) => setPackageForm(prev => ({ ...prev, estimatedValueCurrency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.id} value={currency.code}>
                                {currency.code} - {currency.name} ({currency.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Warehouse Notes */}
                    <div>
                      <Label htmlFor="warehouse-notes">Warehouse Notes</Label>
                      <Textarea
                        id="warehouse-notes"
                        placeholder="Internal notes for warehouse staff..."
                        value={packageForm.warehouseNotes}
                        onChange={(e) => setPackageForm(prev => ({ ...prev, warehouseNotes: e.target.value }))}
                      />
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <Label htmlFor="special-instructions">Special Instructions</Label>
                      <Textarea
                        id="special-instructions"
                        placeholder="Customer-visible special handling instructions..."
                        value={packageForm.specialInstructions}
                        onChange={(e) => setPackageForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      />
                    </div>

                    {/* Package Flags */}
                    <div className="space-y-3">
                      <Label>Package Characteristics</Label>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="fragile"
                          checked={packageForm.isFragile}
                          onCheckedChange={(checked) => setPackageForm(prev => ({ ...prev, isFragile: checked as boolean }))}
                        />
                        <Label htmlFor="fragile" className="flex items-center gap-2 cursor-pointer">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Fragile - Handle with care
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="high-value"
                          checked={packageForm.isHighValue}
                          onCheckedChange={(checked) => setPackageForm(prev => ({ ...prev, isHighValue: checked as boolean }))}
                        />
                        <Label htmlFor="high-value" className="flex items-center gap-2 cursor-pointer">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          High Value - Secure handling
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="adult-signature"
                          checked={packageForm.requiresAdultSignature}
                          onCheckedChange={(checked) => setPackageForm(prev => ({ ...prev, requiresAdultSignature: checked as boolean }))}
                        />
                        <Label htmlFor="adult-signature" className="flex items-center gap-2 cursor-pointer">
                          <FileSignature className="h-4 w-4 text-blue-500" />
                          Requires Adult Signature
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="restricted"
                          checked={packageForm.isRestricted}
                          onCheckedChange={(checked) => setPackageForm(prev => ({ ...prev, isRestricted: checked as boolean }))}
                        />
                        <Label htmlFor="restricted" className="flex items-center gap-2 cursor-pointer">
                          <Ban className="h-4 w-4 text-red-500" />
                          Restricted Item
                        </Label>
                      </div>
                    </div>

                    {/* Create Package Button */}
                    <Button 
                      onClick={() => handleCreatePackage(selectedItem)}
                      disabled={creating || !packageForm.weightActualKg}
                      className="w-full"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Package...
                        </>
                      ) : (
                        <>
                          <Package className="mr-2 h-4 w-4" />
                          Create Package
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}