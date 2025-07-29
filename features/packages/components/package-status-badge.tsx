import { Badge } from '@/components/ui/badge';

interface PackageStatusBadgeProps {
  status: string;
}

export function PackageStatusBadge({ status }: PackageStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'received':
        return { variant: 'secondary' as const, label: 'Received' };
      case 'processing':
        return { variant: 'default' as const, label: 'Processing' };
      case 'ready_to_ship':
        return { variant: 'outline' as const, label: 'Ready to Ship' };
      case 'shipped':
        return { variant: 'default' as const, label: 'Shipped' };
      case 'delivered':
        return { variant: 'default' as const, label: 'Delivered' };
      default:
        return { variant: 'secondary' as const, label: status };
    }
  };

  const { variant, label } = getStatusConfig(status);

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}
