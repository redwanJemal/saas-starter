import { Badge } from '@/components/ui/badge';

interface CustomerStatusBadgeProps {
  status: string;
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, label: 'Active' };
      case 'inactive':
        return { variant: 'secondary' as const, label: 'Inactive' };
      case 'suspended':
        return { variant: 'destructive' as const, label: 'Suspended' };
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
