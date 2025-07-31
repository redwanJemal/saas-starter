// features/shipping/components/zones-table-columns.tsx

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Calendar } from 'lucide-react';
import { Zone } from '../types/zone.types';
import { ZoneStatusBadge } from './zone-status-badge';
import { ZoneActionsDropdown } from './zone-actions-dropdown';

export const createZonesTableColumns = (
  onEdit: (zone: Zone) => void,
  onDelete: (zoneId: string) => void,
  onView?: (zoneId: string) => void
): ColumnDef<Zone>[] => [
  {
    accessorKey: 'name',
    header: 'Zone Name',
    cell: ({ row }) => {
      const zone = row.original;
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">
              {zone.name}
            </div>
            {zone.description && (
              <div className="text-sm text-gray-500 truncate">
                {zone.description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'countryCount',
    header: 'Countries',
    cell: ({ row }) => {
      const zone = row.original;
      return (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{zone.countryCount}</span>
          <span className="text-sm text-gray-500">
            {zone.countryCount === 1 ? 'country' : 'countries'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const zone = row.original;
      return <ZoneStatusBadge status={zone.isActive} />;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const zone = row.original;
      const date = new Date(zone.createdAt);
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{date.toLocaleDateString()}</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const zone = row.original;
      return (
        <div className="flex justify-end">
          <ZoneActionsDropdown
            zone={zone}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        </div>
      );
    },
  },
];