// app/admin/packages/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package as PackageIcon, 
  User, 
  MapPin, 
  Truck, 
  Calendar,
  Weight,
  Ruler,
  FileText,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PackageDetails {
  package: {
    id: string;
    trackingInbound: string;
    senderName: string;
    weightActualKg: number;
    dimLCm: number;
    dimWCm: number;
    dimHCm: number;
    status: string;
    receivedAt: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    suiteCodeCaptured: string;
    
    // Warehouse details
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    warehouseCountryCode: string;
    
    // Account details
    accountId: string;
    customerId: string;
    accountFirstName: string;
    accountLastName: string;
    accountEmail: string;
    accountPhone: string;
  };
  shipments: Array<{
    id: string;
    status: string;
    carrierCode: string;
    carrierService: string;
    trackingOutbound: string;
    declaredValue: number;
    declaredCurrency: string;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
    storageUrl: string;
    createdAt: string;
  }>;
}

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'received': 'bg-blue-100 text-blue-800',
  'ready_to_ship': 'bg-green-100 text-green-800',
  'shipped': 'bg-purple-100 text-purple-800',
  'missing': 'bg-red-100 text-red-800',
  'returned': 'bg-gray-100 text-gray-800',
  'disposed': 'bg-red-100 text-red-800',
};

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [packageData, setPackageData] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const packageId = params.id as string;

  useEffect(() => {
    fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/packages/${packageId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch package details');
      }
      
      const data = await response.json();
      setPackageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested package could not be found.'}</p>
          <Button onClick={() => router.push('/dashboard/packages')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  const { package: pkg, shipments, documents } = packageData;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/packages')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Packages
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Package Details</h1>
            <p className="text-gray-600">Tracking: {pkg.trackingInbound}</p>
          </div>
        </div>
        <Badge className={statusColors[pkg.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
          {pkg.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PackageIcon className="mr-2 h-5 w-5" />
              Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                <p className="font-mono">{pkg.trackingInbound}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Suite Code</label>
                <p className="font-mono">{pkg.suiteCodeCaptured}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Sender</label>
                <p>{pkg.senderName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Received Date</label>
                <p>{formatDate(pkg.receivedAt)}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Weight className="mr-2 h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Weight</label>
                  <p>{pkg.weightActualKg} kg</p>
                </div>
              </div>
              <div className="flex items-center">
                <Ruler className="mr-2 h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Dimensions</label>
                  <p>{pkg.dimLCm} × {pkg.dimWCm} × {pkg.dimHCm} cm</p>
                </div>
              </div>
            </div>

            {pkg.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm">{pkg.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Customer ID</label>
                <p className="font-mono">{pkg.customerId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p>{pkg.accountFirstName} {pkg.accountLastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p>{pkg.accountEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p>{pkg.accountPhone}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-500">Warehouse</label>
                <p>{pkg.warehouseName} ({pkg.warehouseCode})</p>
                <p className="text-sm text-gray-600">{pkg.warehouseCountryCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipments */}
        {shipments.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Shipments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {shipment.carrierCode} - {shipment.carrierService}
                      </h4>
                      <Badge>{shipment.status.replace('_', ' ').toUpperCase()}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-500">Tracking</label>
                        <p className="font-mono">{shipment.trackingOutbound}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-500">Declared Value</label>
                        <p>{shipment.declaredValue} {shipment.declaredCurrency}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-500">Created</label>
                        <p>{formatDate(shipment.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Documents & Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 text-center">
                    <div className="mb-2">
                      {doc.fileType.startsWith('image/') ? (
                        <ImageIcon className="h-8 w-8 mx-auto text-blue-500" />
                      ) : (
                        <FileText className="h-8 w-8 mx-auto text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">{formatDate(doc.createdAt)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => window.open(doc.storageUrl, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {pkg.status === 'ready_to_ship' && (
          <Button>
            Create Shipment
          </Button>
        )}
        <Button variant="outline">
          Edit Package
        </Button>
      </div>
    </div>
  );
}