// components/admin/receiving/PackageBasicInfo.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, User, Building2, MapPin } from 'lucide-react';

interface PackageBasicInfoProps {
  formData: {
    description: string;
    senderName: string;
    senderCompany: string;
    senderAddress: string;
    receivedAt: string;
  };
  onChange: (updates: Partial<PackageBasicInfoProps['formData']>) => void;
}

export function PackageBasicInfo({ formData, onChange }: PackageBasicInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Basic Package Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Package Description */}
          <div className="md:col-span-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Package Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the package contents (e.g., Electronics - iPhone 15, Clothing - Nike Shoes, etc.)"
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="mt-1"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide a clear description of the package contents for customs and tracking purposes.
            </p>
          </div>

          {/* Sender Information */}
          <div>
            <Label htmlFor="senderName" className="text-sm font-medium flex items-center gap-1">
              <User className="h-3 w-3" />
              Sender Name
            </Label>
            <Input
              id="senderName"
              placeholder="John Smith"
              value={formData.senderName}
              onChange={(e) => onChange({ senderName: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="senderCompany" className="text-sm font-medium flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Sender Company
            </Label>
            <Input
              id="senderCompany"
              placeholder="Amazon, eBay, etc."
              value={formData.senderCompany}
              onChange={(e) => onChange({ senderCompany: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Sender Address */}
          <div className="md:col-span-2">
            <Label htmlFor="senderAddress" className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Sender Address
            </Label>
            <Textarea
              id="senderAddress"
              placeholder="123 Main Street, City, State, Country"
              value={formData.senderAddress}
              onChange={(e) => onChange({ senderAddress: e.target.value })}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Received At */}
          <div>
            <Label htmlFor="receivedAt" className="text-sm font-medium">
              Received Date & Time *
            </Label>
            <Input
              id="receivedAt"
              type="datetime-local"
              value={formData.receivedAt}
              onChange={(e) => onChange({ receivedAt: e.target.value })}
              className="mt-1"
              required
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            Tips for Package Description
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Be specific about the contents (e.g., "Electronics - Apple iPhone 15 Pro" not just "Phone")</li>
            <li>• Include brand names when visible</li>
            <li>• Mention quantity if multiple items</li>
            <li>• This information will be used for customs declarations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}