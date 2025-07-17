
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, Target, Settings } from 'lucide-react';
import { FinancingCalculator } from '@/lib/financial/FinancingCalculator';
import { ConsortiumCalculator } from '@/lib/financial/ConsortiumCalculator';
import { useSimulationSettings } from '@/hooks/useSimulationSettings';
import { formatCurrency } from '@/lib/utils';

const SimulacaoConsorcio = () => {
  const { settings } = useSimulationSettings();
  const [assetValue, setAssetValue] = useState<number>(50000);
  const [installments, setInstallments] = useState<number>(60);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [assetType, setAssetType] = useState<'vehicle' | 'real_estate'>('vehicle');

  // Cálculos
  const financingRate = assetType === 'vehicle' ? settings.vehicleFinancingRate : settings.realEstateFinancingRate;
  
  const priceCalculation = FinancingCalculator.calculatePrice(
    assetValue - downPayment,
    financingRate,
    installments
  );
  
  const sacCalculation = FinancingCalculator.calculateSAC(
    assetValue - downPayment,
    financingRate,
    installments
  );
  
  const consortiumCalculation = ConsortiumCalculator.calculate({
    assetValue,
    installments,
    downPayment,
    adminRate: settings.consortiumAdminRate,
    fundRate: settings.consortiumFundRate
  });

  const ComparisonCard = ({ 
    title, 
    monthlyPayment, 
    totalAmount, 
    totalInterest, 
    highlight = false,
    badge,
    icon
  }: {
    title: string;
    monthlyPayment: number;
    totalAmount: number;
    totalInterest: number;
    highlight?: boolean;
    badge?: string;
    icon?: React.ReactNode;
  }) => (
    <Card className={highlight ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {badge && <Badge variant={highlight ? 'default' : 'secondary'}>{badge}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <Label className="text-sm text-muted-foreground">Parcela Mensal</Label>
          <p className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">Total a Pagar</Label>
            <p className="font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Total de Juros</Label>
            <p className="font-semibold text-destructive">{formatCurrency(totalInterest)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Simulação de Consórcio</h1>
          <p className="text-muted-foreground">
            Compare consórcio com financiamento tradicional
          </p>
        </div>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Simulação */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Dados da Simulação
            </CardTitle>
            <CardDescription>
              Preencha os dados para simular
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="assetType">Tipo de Bem</Label>
              <Select value={assetType} onValueChange={(value: 'vehicle' | 'real_estate') => setAssetType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Veículo</SelectItem>
                  <SelectItem value="real_estate">Imóvel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assetValue">Valor do Bem</Label>
              <Input
                id="assetValue"
                type="number"
                value={assetValue}
                onChange={(e) => setAssetValue(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="downPayment">Entrada (Opcional)</Label>
              <Input
                id="downPayment"
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="installments">Prazo (meses)</Label>
              <Select value={installments.toString()} onValueChange={(value) => setInstallments(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="36">36 meses</SelectItem>
                  <SelectItem value="48">48 meses</SelectItem>
                  <SelectItem value="60">60 meses</SelectItem>
                  <SelectItem value="72">72 meses</SelectItem>
                  <SelectItem value="84">84 meses</SelectItem>
                  <SelectItem value="96">96 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Taxa de Financiamento: {financingRate}% a.m.</p>
                <p>Taxa Admin. Consórcio: {settings.consortiumAdminRate}% a.m.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparação Principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComparisonCard
              title="Consórcio"
              monthlyPayment={consortiumCalculation.monthlyPayment}
              totalAmount={consortiumCalculation.totalCost}
              totalInterest={consortiumCalculation.totalAdminCost + consortiumCalculation.totalFundCost}
              highlight={true}
              badge="RECOMENDADO"
              icon={<Target className="h-4 w-4 text-green-600" />}
            />
            
            <ComparisonCard
              title="Financiamento Price"
              monthlyPayment={priceCalculation.monthlyPayment}
              totalAmount={priceCalculation.totalAmount}
              totalInterest={priceCalculation.totalInterest}
              icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
            />
            
            <ComparisonCard
              title="Financiamento SAC"
              monthlyPayment={sacCalculation.monthlyPayment}
              totalAmount={sacCalculation.totalAmount}
              totalInterest={sacCalculation.totalInterest}
              icon={<TrendingDown className="h-4 w-4 text-purple-600" />}
            />
          </div>

          {/* Detalhes do Consórcio */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Consórcio</CardTitle>
              <CardDescription>
                Informações específicas sobre o consórcio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Carta de Crédito</Label>
                  <p className="text-lg font-semibold">{formatCurrency(consortiumCalculation.creditLetter)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Previsão Contemplação</Label>
                  <p className="text-lg font-semibold">{consortiumCalculation.monthsToContemplate}º mês</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Probabilidade</Label>
                  <p className="text-lg font-semibold">{consortiumCalculation.contemplationProbability.toFixed(1)}%</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Economia vs Price</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(priceCalculation.totalAmount - consortiumCalculation.totalCost)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vantagens do Consórcio */}
          <Card>
            <CardHeader>
              <CardTitle>Por que escolher Consórcio?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Sem juros, apenas taxa de administração</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Parcelas fixas durante todo o período</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Possibilidade de contemplação antecipada</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Não compromete renda para financiamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Economia significativa no longo prazo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Flexibilidade nas condições de pagamento</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimulacaoConsorcio;
