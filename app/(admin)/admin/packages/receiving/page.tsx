// app/(admin)/admin/packages/receiving/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Search, Users, Loader2, Save } from 'lucide-react';
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

interface Document {
  id: string;
  documentId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

interface PackageFormData {
  // Basic Info
  description: string;
  senderName: string;
  senderCompany: string;
  senderAddress: string;
  
  // Measurements
  weightActualKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  
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

  // Pictures state management
  const [pictures, setPictures] = useState<Document[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2)}`);

  // Form data
  const [formData, setFormData] = useState<PackageFormData>({
    description: '',
    senderName: '',
    senderCompany: '',
    senderAddress: '',
    weightActualKg: 0,
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
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
        status: 'assigned',
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

  const resetForm = () => {
    setFormData({
      description: '',
      senderName: '',
      senderCompany: '',
      senderAddress: '',
      weightActualKg: 0,
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,
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
    setPictures([]);
  };

  const handleItemSelect = (item: AssignedItem) => {
    setSelectedItem(item);
    resetForm();
    setFormData(prev => ({
      ...prev,
      receivedAt: new Date().toISOString().slice(0, 16)
    }));
  };

  const calculateVolumetricWeight = () => {
    const { lengthCm, widthCm, heightCm } = formData;
    if (lengthCm && widthCm && heightCm) {
      return (lengthCm * widthCm * heightCm) / 5000;
    }
    return 0;
  };

  const handleFormSubmit = async () => {
    if (!selectedItem) return;

    try {
      setSaving(true);

      // Generate internal ID for package
      const internalId = `PKG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const volumetricWeightKg = calculateVolumetricWeight();

      // Prepare package data for the existing packages API
      const packageData = {
        // Required fields for existing API
        customerProfileId: selectedItem.customerProfileId,
        warehouseId: selectedItem.warehouseId,
        trackingNumberInbound: selectedItem.trackingNumber,
        internalId,
        
        // Basic package info
        description: formData.description,
        senderName: formData.senderName || null,
        senderCompany: formData.senderCompany || null,
        senderAddress: formData.senderAddress || null,
        
        // Measurements
        weightActualKg: parseFloat(formData.weightActualKg.toString()),
        lengthCm: formData.lengthCm ? parseFloat(formData.lengthCm.toString()) : null,
        widthCm: formData.widthCm ? parseFloat(formData.widthCm.toString()) : null,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm.toString()) : null,
        volumetricWeightKg,
        
        // Declaration
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue.toString()) : null,
        estimatedValueCurrency: formData.estimatedValueCurrency,
        customsDescription: formData.customsDescription || null,
        
        // Status and compliance
        status: formData.status,
        warehouseNotes: formData.statusNotes || null,
        isFragile: false, // Default
        isHighValue: formData.estimatedValue ? formData.estimatedValue > 1000 : false,
        requiresAdultSignature: false, // Default
        isRestricted: formData.hasProhibitedItems,
        
        // Additional fields for receiving workflow
        incomingShipmentItemId: selectedItem.id, // Link to assigned item
        
        // Timestamps
        receivedAt: new Date(formData.receivedAt),
        processedAt: new Date(),
        
        // Session for pictures
        sessionId,
        
        // Mark this as a receiving operation (not just package creation)
        isReceivingOperation: true
      };

      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create package');
      }

      const result = await response.json();
      
      // If we have pictures and package was created successfully, convert them
      if (sessionId && pictures.length > 0 && result.packageId) {
        try {
          await fetch('/api/admin/documents/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              packageId: result.packageId,
              documentType: 'picture'
            })
          });
        } catch (docError) {
          console.error('Error converting documents:', docError);
          // Don't fail the whole operation
        }
      }

      // Update assigned item status to 'received'
      try {
        await fetch('/api/admin/assign-packages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: selectedItem.id,
            status: 'received'
          })
        });
      } catch (updateError) {
        console.error('Error updating assigned item status:', updateError);
        // Don't fail the operation
      }

      alert(`Package ${result.internalId || internalId} received successfully!`);
      
      // Reset form and refresh list
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

  const filteredItems = assignedItems.filter(item =>
    item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left Sidebar - Assigned Items */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Assigned Items Ready for Receiving
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tracking number or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No assigned items found</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedItem?.id === item.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.trackingNumber}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{item.customerName}</p>
                      <p className="text-xs text-gray-500">{item.customerId}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Scanned: {new Date(item.scannedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
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
                    packageId={undefined} // No package ID yet since we're creating it
                    pictures={pictures}
                    setPictures={setPictures}
                    sessionId={sessionId}
                    maxFiles={10}
                    disabled={saving}
                    onUploadComplete={(newPictures) => {
                      console.log('Pictures uploaded:', newPictures);
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