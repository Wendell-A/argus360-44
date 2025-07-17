
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Percent, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DetailedStatementProps {
  consortiumData: {
    creditValue: number;
    monthlyPayment: number;
    adminFee: number;
    fundFee: number;
    totalAdminCost: number;
    totalFundCost: number;
    totalCost: number;
    installments: number;
  };
  financingData: {
    monthlyPayment: number;
    totalAmount: number;
    totalInterest: number;
  };
}

export const ConsortiumDetailedStatement = ({ consortiumData, financingData }: DetailedStatementProps) => {
  const savings = financingData.totalAmount - consortiumData.totalCost;
  const savingsPercentage = ((savings / financingData.totalAmount) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Extrato Detalhado do Consórcio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo de Economia */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Economia Total</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(savings)}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-700">
                <TrendingDown className="w-3 h-3 mr-1" />
                {savingsPercentage.toFixed(1)}% menor
              </Badge>
            </div>
          </div>
        </div>

        {/* Comparação Mensal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-green-600 mb-2">Consórcio</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Parcela Principal:</span>
                <span>{formatCurrency(consortiumData.creditValue / consortiumData.installments)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa Administração:</span>
                <span>{formatCurrency(consortiumData.adminFee)}</span>
              </div>
              {consortiumData.fundFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Fundo Comum:</span>
                  <span>{formatCurrency(consortiumData.fundFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Mensal:</span>
                <span>{formatCurrency(consortiumData.monthlyPayment)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-red-600 mb-2">Financiamento</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Parcela + Juros:</span>
                <span>{formatCurrency(financingData.monthlyPayment)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Mensal:</span>
                <span>{formatCurrency(financingData.monthlyPayment)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Totais Finais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-700 mb-3">Total Consórcio</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Valor do Bem:</span>
                <span>{formatCurrency(consortiumData.creditValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxas Administrativas:</span>
                <span>{formatCurrency(consortiumData.totalAdminCost)}</span>
              </div>
              {consortiumData.totalFundCost > 0 && (
                <div className="flex justify-between">
                  <span>Fundo Comum:</span>
                  <span>{formatCurrency(consortiumData.totalFundCost)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-green-700 border-t pt-2">
                <span>Total Geral:</span>
                <span>{formatCurrency(consortiumData.totalCost)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-700 mb-3">Total Financiamento</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Valor do Bem:</span>
                <span>{formatCurrency(consortiumData.creditValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Juros Totais:</span>
                <span>{formatCurrency(financingData.totalInterest)}</span>
              </div>
              <div className="flex justify-between font-bold text-red-700 border-t pt-2">
                <span>Total Geral:</span>
                <span>{formatCurrency(financingData.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vantagens do Consórcio */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-700 mb-3">Principais Vantagens</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Sem comprometimento de renda</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Parcelas fixas (sem juros)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Possibilidade de contemplação antecipada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Economia significativa total</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
