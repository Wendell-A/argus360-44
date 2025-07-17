
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCommissionSchedules } from "@/hooks/useCommissionSchedules";
import { formatCurrency } from "@/lib/utils";

interface CommissionBreakdownProps {
  productId: string;
  saleValue: number;
  className?: string;
}

export const CommissionBreakdown = ({ productId, saleValue, className }: CommissionBreakdownProps) => {
  const { schedules, isLoading } = useCommissionSchedules(productId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Breakdown da Comissão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (schedules.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Breakdown da Comissão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nenhum cronograma configurado</p>
        </CardContent>
      </Card>
    );
  }

  const totalCommissionRate = schedules.reduce((sum, schedule) => sum + schedule.percentage, 0);
  const totalCommissionValue = saleValue * (totalCommissionRate / 100);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Breakdown da Comissão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">Total:</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{totalCommissionRate}%</Badge>
            <span className="font-medium">{formatCurrency(totalCommissionValue)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {schedules.map((schedule) => {
            const installmentValue = saleValue * (schedule.percentage / 100);
            return (
              <div key={schedule.id} className="flex justify-between items-center text-xs">
                <span>{schedule.installment_number}ª parcela:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {schedule.percentage}%
                  </Badge>
                  <span>{formatCurrency(installmentValue)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
