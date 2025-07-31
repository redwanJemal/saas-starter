// features/shipping/components/rate-actions-dropdown.tsx

'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Copy, Calculator, Calendar, Pause, Play } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ShippingRate } from '../types/rate.types';

interface RateActionsDropdownProps {
  rate: ShippingRate;
  onEdit: (rate: ShippingRate) => void;
  onDelete: (rateId: string) => void;
  onToggleStatus: (rateId: string, isActive: boolean) => void;
  onDuplicate?: (rate: ShippingRate) => void;
  onCalculate?: (rate: ShippingRate) => void;
}

export function RateActionsDropdown({ 
  rate, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onDuplicate,
  onCalculate
}: RateActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEdit = () => {
    onEdit(rate);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this shipping rate? This action cannot be undone.`)) {
      onDelete(rate.id);
    }
    setIsOpen(false);
  };

  const handleToggleStatus = () => {
    onToggleStatus(rate.id, !rate.isActive);
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(rate);
    }
    setIsOpen(false);
  };

  const handleCalculate = () => {
    if (onCalculate) {
      onCalculate(rate);
    }
    setIsOpen(false);
  };

  const isExpired = rate.effectiveUntil && new Date(rate.effectiveUntil) < new Date();
  const isNotYetActive = new Date(rate.effectiveFrom) > new Date();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Rate
        </DropdownMenuItem>
        
        {onCalculate && (
          <DropdownMenuItem onClick={handleCalculate}>
            <Calculator className="mr-2 h-4 w-4" />
            Test Rate Calculation
          </DropdownMenuItem>
        )}
        
        {onDuplicate && (
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Rate
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={handleToggleStatus}>
          {rate.isActive ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Deactivate Rate
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Activate Rate
            </>
          )}
        </DropdownMenuItem>
        
        {(isExpired || isNotYetActive) && (
          <DropdownMenuItem>
            <Calendar className="mr-2 h-4 w-4" />
            {isExpired ? 'Extend Validity' : 'Adjust Start Date'}
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Rate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}