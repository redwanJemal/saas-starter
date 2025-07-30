// features/warehouses/components/warehouse-status-badge.tsx

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WarehouseStatusBadgeProps {
  status: 'active' | 'inactive' | 'maintenance';
  className?: string;
}

export function WarehouseStatusBadge({ status, className }: WarehouseStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          label: 'Active', 
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
      case 'inactive':
        return { 
          label: 'Inactive', 
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        };
      case 'maintenance':
        return { 
          label: 'Maintenance', 
          variant: 'destructive' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100'
        };
      default:
        return { 
          label: status, 
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}