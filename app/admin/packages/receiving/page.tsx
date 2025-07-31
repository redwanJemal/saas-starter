// app/admin/packages/receiving/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, Search, User, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { PackageForm } from '@/features/packages/components/receiving/package-form';
import { PackagePhotoUpload } from '@/features/packages/components/package-photo-upload';
import { useIncomingShipmentItems, useCreatePackage } from '@/features/packages/hooks/use-packages-query';
import { toast } from 'sonner';
import type { CreatePackageData, IncomingShipmentItem } from '@/features/packages/types/package.types';

export default function PackageReceivingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<IncomingShipmentItem | null>(null);
  const [photos, setPhotos] = useState([]);

  // Data fetching
  const { data: itemsResponse, refetch } = useIncomingShipmentItems({
    assignmentStatus: 'assigned',
    search: searchQuery,
    page: 1,
    limit: 20
  });

  const createPackage = useCreatePackage();

  const assignedItems = itemsResponse?.data || [];

  const handleItemSelect = (item: IncomingShipmentItem) => {
    setSelectedItem(item);
    setPhotos([]); // Reset photos when selecting new item
  };

  const handlePackageSubmit = async (packageData: CreatePackageData) => {
    try {
      await createPackage.mutateAsync(packageData);
      
      toast.success('Package receiving completed successfully');
      
      // Reset form
      setSelectedItem(null);
      setPhotos([]);
      
      // Refetch assigned items
      await refetch();
    } catch (error) {
      console.error('Failed to create package:', error);
      toast.error('Failed to complete package receiving');
    }
  };

  const handleCancel = () => {
    setSelectedItem(null);
    setPhotos([]);
  };

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
            <h1 className="text-2xl font-bold">Package Receiving</h1>
            <p className="text-gray-600">Complete package details with measurements and photos</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Items</p>
                <p className="text-2xl font-bold">{assignedItems.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Selected Item</p>
                <p className="text-2xl font-bold">{selectedItem ? 1 : 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Photos</p>
                <p className="text-2xl font-bold">{photos.length}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready to Save</p>
                <p className="text-2xl font-bold">
                  {selectedItem && photos.length > 0 ? 1 : 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Left: Assigned Items List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracking numbers..."
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {assignedItems.map((item: IncomingShipmentItem) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedItem?.id === item.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleItemSelect(item)}
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-medium">
                        {item.trackingNumber}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <User className="h-3 w-3" />
                        {item.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.courierName} • {item.warehouseId}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.assignmentStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {assignedItems.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No assigned items found</p>
                  <Link href="/admin/packages/assignment">
                    <Button size="sm" className="mt-2">
                      Go to Assignment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Package Form and Photos */}
        <div className="col-span-3">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Package Form */}
              <PackageForm
                assignedItem={selectedItem}
                onSubmit={handlePackageSubmit}
                onCancel={handleCancel}
                isSubmitting={createPackage.isPending}
              />

              {/* Photo Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Package Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <PackagePhotoUpload
                    photos={photos}
                    onPhotosChange={setPhotos as any}
                    maxPhotos={10}
                    maxFileSize={5}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select an Item to Receive
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose an assigned item from the left to begin the receiving process.
                </p>
                <div className="space-y-2">
                  <Link href="/admin/packages/assignment">
                    <Button variant="outline">
                      <User className="mr-2 h-4 w-4" />
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