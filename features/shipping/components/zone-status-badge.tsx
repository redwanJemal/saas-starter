// features/shipping/components/zone-status-badge.tsx

'use client';

import { Badge } from '@/components/ui/badge';

interface ZoneStatusBadgeProps {
  status: boolean;
  className?: string;
}

export function ZoneStatusBadge({ status, className }: ZoneStatusBadgeProps) {
  const getStatusConfig = (isActive: boolean) => {
    if (isActive) {
      return { 
        label: 'Active', 
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    return { 
      label: 'Inactive', 
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}