// features/shipping/components/zone-actions-dropdown.tsx

'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Eye, Settings, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Zone } from '../types/zone.types';

interface ZoneActionsDropdownProps {
  zone: Zone;
  onEdit: (zone: Zone) => void;
  onDelete: (zoneId: string) => void;
  onView?: (zoneId: string) => void;
}

export function ZoneActionsDropdown({ 
  zone, 
  onEdit, 
  onDelete, 
  onView 
}: ZoneActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEdit = () => {
    onEdit(zone);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the zone "${zone.name}"? This action cannot be undone.`)) {
      onDelete(zone.id);
    }
    setIsOpen(false);
  };

  const handleView = () => {
    if (onView) {
      onView(zone.id);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onView && (
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Zone
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MapPin className="mr-2 h-4 w-4" />
          View Countries ({zone.countryCount})
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Configure Rates
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Zone
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}