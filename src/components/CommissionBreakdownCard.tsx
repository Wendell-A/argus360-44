import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCommissionBreakdown } from "@/hooks/useCommissionBreakdown";
import { formatCurrency } from "@/lib/utils";
import { Building, User, TrendingUp, Clock, CheckCircle, DollarSign } from "lucide-react";

interface CommissionBreakdownCardProps {
  className?: string;
}

export const CommissionBreakdownCard = ({ className }: CommissionBreakdownCardProps) => {
  const { data: metrics, isLoading, error } = useCommissionBreakdown();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Breakdown de Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Breakdown de Comissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Erro ao carregar dados de comissões
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Breakdown de Comissões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Geral */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Geral:</span>
            <span className="text-lg font-bold">
              {formatCurrency(metrics.combined.total_amount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Total de Comissões:</span>
            <span>{metrics.combined.total_count}</span>
          </div>
        </div>

        <Separator />

        {/* Comissões do Escritório */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="font-medium text-sm">Escritório</span>
            <Badge variant="secondary" className="text-xs">
              {metrics.office.count}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total:</span>
              <span className="font-medium">
                {formatCurrency(metrics.office.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Média:</span>
              <span>{formatCurrency(metrics.office.avg_amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-yellow-600 font-medium">
                {formatCurrency(metrics.office.pending_amount)}
              </div>
              <div className="text-muted-foreground">Pendente</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-medium">
                {formatCurrency(metrics.office.approved_amount)}
              </div>
              <div className="text-muted-foreground">Aprovado</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-medium">
                {formatCurrency(metrics.office.paid_amount)}
              </div>
              <div className="text-muted-foreground">Pago</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Comissões do Vendedor */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium text-sm">Vendedores</span>
            <Badge variant="secondary" className="text-xs">
              {metrics.seller.count}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total:</span>
              <span className="font-medium">
                {formatCurrency(metrics.seller.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Média:</span>
              <span>{formatCurrency(metrics.seller.avg_amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-yellow-600 font-medium">
                {formatCurrency(metrics.seller.pending_amount)}
              </div>
              <div className="text-muted-foreground">Pendente</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-medium">
                {formatCurrency(metrics.seller.approved_amount)}
              </div>
              <div className="text-muted-foreground">Aprovado</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-medium">
                {formatCurrency(metrics.seller.paid_amount)}
              </div>
              <div className="text-muted-foreground">Pago</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Indicadores de Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium text-sm">Status Geral</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-yellow-600" />
                <span>Pendente</span>
              </div>
              <span className="font-medium">
                {metrics.combined.pending_percentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.combined.pending_percentage} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-blue-600" />
                <span>Aprovado</span>
              </div>
              <span className="font-medium">
                {metrics.combined.approved_percentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.combined.approved_percentage} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Pago</span>
              </div>
              <span className="font-medium">
                {metrics.combined.paid_percentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.combined.paid_percentage} 
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};