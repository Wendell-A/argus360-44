import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface CommissionStatusBadgeProps {
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  type: 'office' | 'seller';
}

export const CommissionStatusBadge: React.FC<CommissionStatusBadgeProps> = ({ status, type }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-yellow-600'
        };
      case 'approved':
        return {
          label: type === 'office' ? 'A Receber' : 'A Pagar',
          variant: 'default' as const,
          icon: DollarSign,
          color: 'text-blue-600'
        };
      case 'paid':
        return {
          label: type === 'office' ? 'Recebida' : 'Paga',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600'
        };
      case 'cancelled':
        return {
          label: 'Cancelada',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600'
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: Clock,
          color: 'text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
};
