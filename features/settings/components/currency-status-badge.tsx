// features/settings/components/currency-status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CurrencyStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function CurrencyStatusBadge({ isActive, className }: CurrencyStatusBadgeProps) {
  return (
    <Badge 
      variant={isActive ? 'default' : 'secondary'} 
      className={cn(
        isActive ? 'bg-green-100 text-green-800' : '', 
        className
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}