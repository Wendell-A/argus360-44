
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BidAnalysisProps {
  downPayment: number;
  creditValue: number;
  minimumBidPercentages: number[];
}

export const ConsortiumBidAnalysis = ({ 
  downPayment, 
  creditValue, 
  minimumBidPercentages = [25, 50] 
}: BidAnalysisProps) => {
  const bidPercentage = creditValue > 0 ? (downPayment / creditValue) * 100 : 0;
  
  const getBidStatus = () => {
    if (downPayment === 0) {
      return {
        type: 'info' as const,
        icon: Info,
        title: 'Sem Lance',
        message: 'Aguardará contemplação por sorteio'
      };
    }
    
    if (bidPercentage >= 50) {
      return {
        type: 'success' as const,
        icon: CheckCircle,
        title: 'Lance Alto',
        message: 'Excelentes chances de contemplação antecipada'
      };
    }
    
    if (bidPercentage >= 25) {
      return {
        type: 'warning' as const,
        icon: AlertTriangle,
        title: 'Lance Médio',
        message: 'Boas chances de contemplação antecipada'
      };
    }
    
    const missingFor25 = (creditValue * 0.25) - downPayment;
    return {
      type: 'warning' as const,
      icon: AlertTriangle,
      title: 'Lance Insuficiente',
      message: `Faltam ${formatCurrency(missingFor25)} para lance mínimo de 25%`
    };
  };

  const status = getBidStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <status.icon className="h-5 w-5" />
          Análise de Lance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valor do Lance</p>
            <p className="text-lg font-semibold">{formatCurrency(downPayment)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Percentual</p>
            <p className="text-lg font-semibold">{bidPercentage.toFixed(2)}%</p>
          </div>
        </div>

        <Alert className={
          status.type === 'success' ? 'border-green-200 bg-green-50' :
          status.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
          'border-blue-200 bg-blue-50'
        }>
          <status.icon className="h-4 w-4" />
          <AlertDescription>
            <strong>{status.title}:</strong> {status.message}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-medium">Referências de Lance:</p>
          <div className="flex gap-2">
            <Badge variant={bidPercentage >= 25 ? "default" : "outline"}>
              25% - {formatCurrency(creditValue * 0.25)}
            </Badge>
            <Badge variant={bidPercentage >= 50 ? "default" : "outline"}>
              50% - {formatCurrency(creditValue * 0.50)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
