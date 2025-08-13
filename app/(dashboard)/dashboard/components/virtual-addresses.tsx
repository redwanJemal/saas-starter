// app/(dashboard)/dashboard/components/virtual-addresses.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Copy, Check, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface VirtualAddress {
  id: string;
  warehouseId: string;
  suiteCode: string;
  status: string;
  warehouse: {
    name: string;
    country: string;
    flagEmoji?: string;
  };
  formattedAddress: {
    recipientName: string;
    companyName?: string;
    suiteNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  copyableAddress: string;
}

export function VirtualAddresses() {
  const [addresses, setAddresses] = useState<VirtualAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchVirtualAddresses();
  }, []);

  const fetchVirtualAddresses = async () => {
    try {
      const response = await fetch('/api/virtual-addresses');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data || []);
      }
    } catch (error) {
      console.error('Error fetching virtual addresses:', error);
      toast.error('Failed to load virtual addresses');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (address: VirtualAddress) => {
    try {
      await navigator.clipboard.writeText(address.copyableAddress);
      setCopiedId(address.id);
      toast.success('Address copied to clipboard!');
      
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Virtual Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Virtual Addresses
          <Badge variant="outline" className="ml-2">
            {addresses.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {addresses.length > 0 ? (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {address.warehouse.flagEmoji && (
                          <span className="text-lg">{address.warehouse.flagEmoji}</span>
                        )}
                        <h3 className="font-medium">{address.warehouse.name}</h3>
                      </div>
                      <Badge className={getStatusColor(address.status)} variant="outline">
                        {address.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">
                        {address.formattedAddress.recipientName}
                      </p>
                      {address.formattedAddress.companyName && (
                        <p>{address.formattedAddress.companyName}</p>
                      )}
                      <p className="font-medium text-blue-600">
                        {address.formattedAddress.suiteNumber}
                      </p>
                      <p>{address.formattedAddress.addressLine1}</p>
                      {address.formattedAddress.addressLine2 && (
                        <p>{address.formattedAddress.addressLine2}</p>
                      )}
                      <p>
                        {address.formattedAddress.city}
                        {address.formattedAddress.stateProvince && 
                          `, ${address.formattedAddress.stateProvince}`
                        } {address.formattedAddress.postalCode}
                      </p>
                      <p>{address.formattedAddress.country}</p>
                      {address.formattedAddress.phone && (
                        <p>Phone: {address.formattedAddress.phone}</p>
                      )}
                    </div>
                    
                    <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>Important:</strong> Always include your suite code ({address.suiteCode}) 
                        when shipping to this address. Use the copy button to get the complete formatted address.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(address)}
                      disabled={copiedId === address.id}
                    >
                      {copiedId === address.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Address
                        </>
                      )}
                    </Button>
                    
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/addresses/virtual/${address.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Shopping Tip:</strong> Copy and paste these addresses exactly as shown when 
                checking out from online stores. Your customer ID is included to ensure proper 
                package routing to your account.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No virtual addresses</h3>
            <p className="text-gray-600 mb-4">
              Virtual addresses will be automatically assigned when your account is activated.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/addresses">
                View Address Settings
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}