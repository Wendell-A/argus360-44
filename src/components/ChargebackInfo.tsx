
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChargebackSchedules } from "@/hooks/useChargebackSchedules";
import { AlertTriangle } from "lucide-react";

interface ChargebackInfoProps {
  productId: string;
  className?: string;
}

export const ChargebackInfo = ({ productId, className }: ChargebackInfoProps) => {
  const { schedules, isLoading } = useChargebackSchedules(productId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Regras de Estorno
          </CardTitle>
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
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Regras de Estorno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nenhuma regra configurada</p>
        </CardContent>
      </Card>
    );
  }

  const sortedSchedules = [...schedules].sort((a, b) => a.max_payment_number - b.max_payment_number);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Regras de Estorno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedSchedules.map((schedule) => (
          <div key={schedule.id} className="flex justify-between items-center text-xs">
            <span>Até {schedule.max_payment_number}º pagamento:</span>
            <Badge variant="destructive" className="text-xs">
              {schedule.percentage}%
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
