// features/packages/components/pre-receiving/bulk-scan-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Scan, Upload, Save, RefreshCw } from 'lucide-react';
import { useCreateIncomingShipment } from '../../hooks/use-packages-query';
import { useAdminAuth } from '@/features/auth/hooks/use-admin-auth';

interface BulkScanFormProps {
  warehouses: Array<{ id: string; name: string; code: string }>;
  couriers: Array<{ id: string; name: string; code: string }>;
  onShipmentCreated?: (shipmentId: string) => void;
}

export function BulkScanForm({ warehouses, couriers, onShipmentCreated }: BulkScanFormProps) {
  const { user } = useAdminAuth();
  const [batchReference, setBatchReference] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [expectedPieces, setExpectedPieces] = useState('');
  const [trackingNumbers, setTrackingNumbers] = useState('');
  const [manifestNotes, setManifestNotes] = useState('');

  const createShipment = useCreateIncomingShipment();

  const handleSubmit = async () => {
    if (!selectedWarehouseId || !selectedCourierId || !trackingNumbers.trim() || !user?.tenantId) return;

    const trackingList = trackingNumbers
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      await createShipment.mutateAsync({
        tenantId: user.tenantId,
        warehouseId: selectedWarehouseId,
        courierId: selectedCourierId,
        batchReference: batchReference || `BATCH_${Date.now()}`,
        arrivalDate: arrivalDate ? String(arrivalDate) : String(new Date()),
        trackingNumbers: trackingList,
      });

      // Reset form
      setBatchReference('');
      setTrackingNumbers('');
      setExpectedPieces('');

      onShipmentCreated?.(createShipment.data?.data?.id || '');
    } catch (error) {
      console.error('Failed to create shipment:', error);
    }
  };

  const trackingCount = trackingNumbers.split('\n').filter(t => t.trim()).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Bulk Scan Tracking Numbers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Warehouse</label>
            <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Courier</label>
            <Select value={selectedCourierId} onValueChange={setSelectedCourierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select courier" />
              </SelectTrigger>
              <SelectContent>
                {couriers.map(courier => (
                  <SelectItem key={courier.id} value={courier.id}>
                    {courier.name} ({courier.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Batch Reference</label>
            <Input
              value={batchReference}
              onChange={(e) => setBatchReference(e.target.value)}
              placeholder="Auto-generated if empty"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Arrival Date</label>
            <Input
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Expected Pieces</label>
            <Input
              type="number"
              value={expectedPieces}
              onChange={(e) => setExpectedPieces(e.target.value)}
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Tracking Numbers</label>
          <Textarea
            value={trackingNumbers}
            onChange={(e) => setTrackingNumbers(e.target.value)}
            placeholder="Enter tracking numbers (one per line)"
            rows={8}
            className="font-mono"
          />
          {trackingCount > 0 && (
            <Badge variant="secondary" className="mt-2">
              {trackingCount} tracking numbers
            </Badge>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Manifest Notes</label>
          <Textarea
            value={manifestNotes}
            onChange={(e) => setManifestNotes(e.target.value)}
            placeholder="Optional notes about this shipment"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={createShipment.isPending || !selectedWarehouseId || !selectedCourierId || !trackingNumbers.trim()}
            className="flex-1"
          >
            {createShipment.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating Shipment...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Incoming Shipment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}