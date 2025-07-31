// features/packages/components/assignment/customer-search.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { Customer } from '@/features/customers/types/customer.types';

interface CustomerSearchProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer) => void;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  searchResults?: Customer[];
}

export function CustomerSearch({ 
  selectedCustomer, 
  onCustomerSelect, 
  onSearchChange,
  isLoading = false,
  searchResults = []
}: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.length >= 2) {
        onSearchChange?.(query);
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, onSearchChange]);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Search Customer</label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type customer name, email, or ID..."
            className="w-full"
          />
        </div>

        {selectedCustomer && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>
                    {(selectedCustomer.name?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">
                    {selectedCustomer.name}
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedCustomer.email}
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedCustomer.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      ID: {selectedCustomer.id}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline">Selected Customer</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto">
          <CardContent className="p-2">
            {searchResults.map((customer) => (
              <div
                key={customer.id}
                className="p-2 hover:bg-gray-50 cursor-pointer rounded"
                onClick={() => handleCustomerSelect(customer)}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {(customer.name?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {customer.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {customer.email} • ID: {customer.id}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}