import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Commission {
  id: string;
  status: string;
  commission_amount: number;
}

interface CommissionActionsProps {
  commission: Commission;
  type: 'office' | 'seller';
  onApprove?: () => void;
  onPay?: () => void;
  isLoading?: boolean;
}

export const CommissionActions: React.FC<CommissionActionsProps> = ({
  commission,
  type,
  onApprove,
  onPay,
  isLoading = false
}) => {
  if (commission.status === 'pending' && onApprove) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Aprovar comissão de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.commission_amount)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (commission.status === 'approved' && onPay) {
    const buttonLabel = type === 'office' ? 'Receber' : 'Pagar';
    const tooltipLabel = type === 'office' ? 'Registrar recebimento' : 'Registrar pagamento';

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="default"
              onClick={onPay}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-1" />
                  {buttonLabel}
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipLabel} de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.commission_amount)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">-</span>
  );
};
