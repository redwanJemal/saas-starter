// features/shipping/components/service-type-badge.tsx

'use client';

import { Badge } from '@/components/ui/badge';
import { ServiceType } from '../types/rate.types';

interface ServiceTypeBadgeProps {
  serviceType: ServiceType;
  className?: string;
}

export function ServiceTypeBadge({ serviceType, className }: ServiceTypeBadgeProps) {
  const getServiceConfig = (type: ServiceType) => {
    switch (type) {
      case 'economy':
        return { 
          label: 'Economy', 
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'standard':
        return { 
          label: 'Standard', 
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'express':
        return { 
          label: 'Express', 
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      default:
        return { 
          label: type, 
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getServiceConfig(serviceType);

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}