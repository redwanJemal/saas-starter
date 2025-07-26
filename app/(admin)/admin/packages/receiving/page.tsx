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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ExternalLink,
  Camera,
  FileText,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { PackageBasicInfo } from './components/PackageBasicInfo';
import { PackageMeasurements } from './components/PackageMeasurements';
import { PackageDeclaration } from './components/PackageDeclaration';
import PictureUpload from './components/package-image-upload';
import { PackageStatus } from './components/PackageStatus';

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

interface PackageFormData {
  // Basic Info
  description: string;
  senderName: string;
  senderCompany: string;
  senderAddress: string;
  
  // Measurements
  weightActualKg: number;
  dimensionsLengthCm: number;
  dimensionsWidthCm: number;
  dimensionsHeightCm: number;
  
  // Declaration
  estimatedValue: number;
  estimatedValueCurrency: string;
  customsDescription: string;
  
  // Status
  status: string;
  statusNotes: string;
  
  // Compliance
  hasProhibitedItems: boolean;
  requiresInspection: boolean;
  inspectionNotes: string;
  
  // System
  receivedAt: string;
}

export default function PackageReceivingPage() {
  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AssignedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState<PackageFormData>({
    description: '',
    senderName: '',
    senderCompany: '',
    senderAddress: '',
    weightActualKg: 0,
    dimensionsLengthCm: 0,
    dimensionsWidthCm: 0,
    dimensionsHeightCm: 0,
    estimatedValue: 0,
    estimatedValueCurrency: 'GBP',
    customsDescription: '',
    status: 'received',
    statusNotes: '',
    hasProhibitedItems: false,
    requiresInspection: false,
    inspectionNotes: '',
    receivedAt: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchAssignedItems();
  }, [currentPage, searchQuery]);

  const fetchAssignedItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: 'assigned', // Only show assigned items ready for receiving
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/admin/packages/assigned-items?${params}`);
      if (!response.ok) throw new Error('Failed to fetch assigned items');

      const data = await response.json();
      setAssignedItems(data.assignedItems || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / 20));
    } catch (error) {
      console.error('Error fetching assigned items:', error);
      alert('Error loading assigned items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item: AssignedItem) => {
    setSelectedItem(item);
    // Pre-fill form with any existing data
    setFormData(prev => ({
      ...prev,
      // You might want to fetch existing package data here if it exists
    }));
  };

  const handleFormSubmit = async () => {
    if (!selectedItem) return;

    try {
      setSaving(true);

      // Create the complete package record
      const response = await fetch(`/api/admin/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Link to the assigned item
          incomingShipmentItemId: selectedItem.id,
          
          // Customer info from the assigned item
          customerProfileId: selectedItem.customerProfileId,
          warehouseId: selectedItem.warehouseId,
          
          // Tracking info
          trackingNumberInbound: selectedItem.trackingNumber,
          senderTrackingUrl: selectedItem.courierTrackingUrl,
          
          // Form data
          ...formData,
          
          // Mark as received
          status: 'received'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create package record');
      }

      const packageData = await response.json();
      
      // Update the assigned item status to 'received'
      await fetch(`/api/admin/incoming-shipment-items/${selectedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentStatus: 'received'
        })
      });

      alert('Package receiving completed successfully!');
      
      // Clear selection and refresh list
      setSelectedItem(null);
      resetForm();
      fetchAssignedItems();

    } catch (error) {
      console.error('Error saving package:', error);
      alert('Error saving package. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      senderName: '',
      senderCompany: '',
      senderAddress: '',
      weightActualKg: 0,
      dimensionsLengthCm: 0,
      dimensionsWidthCm: 0,
      dimensionsHeightCm: 0,
      estimatedValue: 0,
      estimatedValueCurrency: 'GBP',
      customsDescription: '',
      status: 'received',
      statusNotes: '',
      hasProhibitedItems: false,
      requiresInspection: false,
      inspectionNotes: '',
      receivedAt: new Date().toISOString().slice(0, 16)
    });
  };

  return (
    <div className="mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Package Receiving</h1>
        <p className="text-gray-600">
          Complete the full receiving process for assigned packages
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Assigned Items List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Assigned Items
                <Badge variant="outline">{assignedItems.length}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tracking numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : assignedItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No assigned items found</p>
                  <Link href="/admin/packages/assignment">
                    <Button variant="outline" size="sm" className="mt-2">
                      Go to Assignment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {assignedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedItem?.id === item.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {item.trackingNumber}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.courierCode || 'Unknown'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          {item.customerName} ({item.customerId})
                        </p>
                        <p className="text-xs text-gray-500">
                          Assigned: {new Date(item.assignedAt).toLocaleDateString()}
                        </p>
                        {item.courierTrackingUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.courierTrackingUrl, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Track
                          </Button>
                        )}
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
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Package Details Form */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Package Receiving
                    </div>
                    <Badge variant="outline">
                      {selectedItem.trackingNumber}
                    </Badge>
                  </CardTitle>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>{' '}
                      <span className="font-medium">
                        {selectedItem.customerName} ({selectedItem.customerId})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Warehouse:</span>{' '}
                      <span className="font-medium">
                        {selectedItem.warehouseName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Courier:</span>{' '}
                      <span className="font-medium">
                        {selectedItem.courierName || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Scanned:</span>{' '}
                      <span className="font-medium">
                        {new Date(selectedItem.scannedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Tabbed Form */}
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="measurements">Measurements</TabsTrigger>
                  <TabsTrigger value="declaration">Declaration</TabsTrigger>
                  <TabsTrigger value="pictures">Pictures</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <PackageBasicInfo
                    formData={formData}
                    onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                  />
                </TabsContent>

                <TabsContent value="measurements">
                  <PackageMeasurements
                    formData={formData}
                    onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                  />
                </TabsContent>

                <TabsContent value="declaration">
                  <PackageDeclaration
                    formData={formData}
                    onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                  />
                </TabsContent>

                <TabsContent value="pictures">
                  <PictureUpload
                    packageId={selectedItem.id}
                    maxFiles={10}
                    onUploadComplete={(pictures) => {
                      console.log('Pictures uploaded:', pictures);
                    }}
                  />
                </TabsContent>

                <TabsContent value="status">
                  <PackageStatus
                    formData={formData}
                    onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                  />
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Complete the package receiving process to make it available for shipping.
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(null);
                          resetForm();
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleFormSubmit}
                        disabled={saving || !formData.description || !formData.weightActualKg}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Complete Receiving
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Package to Receive
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose an assigned item from the left to begin the receiving process.
                </p>
                <div className="space-y-2">
                  <Link href="/admin/packages/assignment">
                    <Button variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Go to Assignment
                    </Button>
                  </Link>
                  <Link href="/admin/packages/pre-receiving">
                    <Button variant="outline">
                      <Search className="mr-2 h-4 w-4" />
                      Pre-Receiving
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}