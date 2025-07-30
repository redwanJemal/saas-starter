// features/settings/components/country-status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CountryStatusBadgeProps {
  isActive: boolean;
  isShippingEnabled?: boolean;
  className?: string;
}

export function CountryStatusBadge({ 
  isActive, 
  isShippingEnabled, 
  className 
}: CountryStatusBadgeProps) {
  if (!isActive) {
    return (
      <Badge variant="secondary" className={cn('', className)}>
        Inactive
      </Badge>
    );
  }

  if (!isShippingEnabled) {
    return (
      <Badge variant="outline" className={cn('border-orange-200 text-orange-700', className)}>
        No Shipping
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={cn('bg-green-100 text-green-800', className)}>
      Active
    </Badge>
  );
}