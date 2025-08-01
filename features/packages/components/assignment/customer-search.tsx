// features/packages/components/assignment/customer-search.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Search, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Customer } from '@/features/customers/types/customer.types';


interface CustomerSearchProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onSearchChange?: (query: string) => void;
  searchResults?: Customer[];
  isLoading?: boolean;
  placeholder?: string;
}

export function CustomerSearch({ 
  selectedCustomer, 
  onCustomerSelect, 
  onSearchChange, 
  searchResults = [],
  isLoading = false,
  placeholder = "Search customers..."
}: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.length >= 2) {
        onSearchChange?.(query);
        setShowDropdown(true);
        setHighlightedIndex(-1);
      } else {
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]); // Remove onSearchChange from dependencies to prevent infinite calls

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setQuery('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleClearSelection = () => {
    onCustomerSelect(null);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleCustomerSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <label className="text-sm font-medium block mb-2">
          {selectedCustomer ? 'Selected Customer' : 'Search Customer'}
        </label>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedCustomer ? selectedCustomer.name : placeholder}
              className={cn(
                "pl-10 pr-10",
                selectedCustomer && "bg-green-50 border-green-200"
              )}
              disabled={!!selectedCustomer}
            />
            {selectedCustomer && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-green-100"
                onClick={handleClearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {!selectedCustomer && searchResults.length > 0 && (
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && !selectedCustomer && (
            <Card 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-hidden shadow-lg"
            >
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Searching customers...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {searchResults.map((customer, index) => (
                      <div
                        key={customer.id}
                        className={cn(
                          "p-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors",
                          "hover:bg-gray-50",
                          highlightedIndex === index && "bg-blue-50"
                        )}
                        onClick={() => handleCustomerSelect(customer)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {customer.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {customer.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {customer.customerId}
                            </div>
                          </div>
                          {highlightedIndex === index && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : query.length >= 2 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No customers found for "{query}"
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-green-100 text-green-700">
                  {selectedCustomer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-green-900">
                  {selectedCustomer.name}
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedCustomer.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    ID: {selectedCustomer.customerId}
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Selected Customer
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-green-700 hover:bg-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Help Text */}
      {!selectedCustomer && (
        <div className="text-xs text-gray-500">
          Type at least 2 characters to search by name, email, or customer ID
        </div>
      )}
    </div>
  );
}