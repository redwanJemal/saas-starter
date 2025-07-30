// features/settings/components/courier-status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CourierStatusBadgeProps {
  isActive: boolean;
  hasIntegration?: boolean;
  className?: string;
}

export function CourierStatusBadge({ 
  isActive, 
  hasIntegration, 
  className 
}: CourierStatusBadgeProps) {
  if (!isActive) {
    return (
      <Badge variant="secondary" className={cn('', className)}>
        Inactive
      </Badge>
    );
  }

  if (hasIntegration) {
    return (
      <Badge variant="default" className={cn('bg-blue-100 text-blue-800', className)}>
        Integrated
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={cn('bg-green-100 text-green-800', className)}>
      Active
    </Badge>
  );
}