// components/admin/receiving/PackageStatus.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  AlertTriangle, 
  XCircle, 
  Package,
  Eye,
  Settings
} from 'lucide-react';

interface PackageStatusProps {
  formData: {
    status: string;
    statusNotes: string;
  };
  onChange: (updates: Partial<PackageStatusProps['formData']>) => void;
}

const PACKAGE_STATUSES = [
  { 
    value: 'received', 
    label: 'Received', 
    color: 'bg-blue-500',
    icon: CheckCircle,
    description: 'Package has been received and processed at the warehouse'
  },
  { 
    value: 'processing', 
    label: 'Processing', 
    color: 'bg-yellow-500',
    icon: Settings,
    description: 'Package is being processed (inspection, repackaging, etc.)'
  },
  { 
    value: 'ready_to_ship', 
    label: 'Ready to Ship', 
    color: 'bg-green-500',
    icon: Package,
    description: 'Package is ready for outbound shipping'
  },
  { 
    value: 'on_hold', 
    label: 'On Hold', 
    color: 'bg-orange-500',
    icon: Clock,
    description: 'Package is temporarily held (pending customer action, inspection, etc.)'
  },
  { 
    value: 'requires_inspection', 
    label: 'Requires Inspection', 
    color: 'bg-purple-500',
    icon: Eye,
    description: 'Package needs detailed inspection before processing'
  },
  { 
    value: 'damaged', 
    label: 'Damaged', 
    color: 'bg-red-500',
    icon: AlertTriangle,
    description: 'Package arrived damaged and requires special handling'
  },
  { 
    value: 'returned', 
    label: 'Returned', 
    color: 'bg-gray-500',
    icon: XCircle,
    description: 'Package has been returned to sender'
  }
];

export function PackageStatus({ formData, onChange }: PackageStatusProps) {
  const currentStatus = PACKAGE_STATUSES.find(s => s.value === formData.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Package Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status Display */}
        {currentStatus && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className={`p-2 rounded-full ${currentStatus.color}`}>
              <currentStatus.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-medium">{currentStatus.label}</div>
              <div className="text-sm text-gray-600">{currentStatus.description}</div>
            </div>
          </div>
        )}

        {/* Status Selection */}
        <div>
          <Label htmlFor="status" className="text-sm font-medium">
            Set Package Status *
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => onChange({ status: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select package status" />
            </SelectTrigger>
            <SelectContent>
              {PACKAGE_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <status.icon className="h-4 w-4" />
                    <span>{status.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Select the appropriate status for this package
          </p>
        </div>

        {/* Status Notes */}
        <div>
          <Label htmlFor="statusNotes" className="text-sm font-medium">
            Status Notes
          </Label>
          <Textarea
            id="statusNotes"
            placeholder="Add any relevant notes about the package status, condition, or special instructions..."
            value={formData.statusNotes}
            onChange={(e) => onChange({ statusNotes: e.target.value })}
            className="mt-1"
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            These notes will be visible to other staff members and may be shared with the customer
          </p>
        </div>

        {/* Status-specific guidance */}
        {formData.status && (
          <div className="space-y-3">
            {formData.status === 'damaged' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Damaged Package Protocol</span>
                </div>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Document damage with detailed photos</li>
                  <li>• Note extent of damage and affected items</li>
                  <li>• Check if contents are still usable</li>
                  <li>• Contact customer about damage and options</li>
                  <li>• Consider insurance claim if applicable</li>
                </ul>
              </div>
            )}

            {formData.status === 'requires_inspection' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Inspection Required</span>
                </div>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Schedule detailed inspection with qualified staff</li>
                  <li>• Check for prohibited or restricted items</li>
                  <li>• Verify contents match description</li>
                  <li>• Document findings with photos if needed</li>
                  <li>• Update status after inspection complete</li>
                </ul>
              </div>
            )}

            {formData.status === 'on_hold' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Package On Hold</span>
                </div>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Specify reason for hold in status notes</li>
                  <li>• Set expected resolution timeframe</li>
                  <li>• Notify customer if action required</li>
                  <li>• Monitor hold duration and follow up</li>
                </ul>
              </div>
            )}

            {formData.status === 'ready_to_ship' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Ready for Shipping</span>
                </div>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Package is available for outbound shipment</li>
                  <li>• Customer can now create shipping labels</li>
                  <li>• All measurements and declarations are complete</li>
                  <li>• Photos and documentation are uploaded</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Status History Preview */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Status Transition</h4>
          <div className="text-xs text-gray-500">
            This status change will be logged with timestamp and operator information for audit purposes.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}