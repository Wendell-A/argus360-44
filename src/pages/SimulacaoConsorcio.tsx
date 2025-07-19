
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, Target, Settings, Save, Info, Clock } from 'lucide-react';
import { FinancingCalculator } from '@/lib/financial/FinancingCalculator';
import { ConsortiumCalculator } from '@/lib/financial/ConsortiumCalculator';
import { useSimulationSettings } from '@/hooks/useSimulationSettings';
import { formatCurrency } from '@/lib/utils';
import { ProductSelector } from '@/components/ProductSelector';
import { ConsortiumBidAnalysis } from '@/components/ConsortiumBidAnalysis';
import { ConsortiumDetailedStatement } from '@/components/ConsortiumDetailedStatement';
import { BankFinancingOptions } from '@/components/BankFinancingOptions';
import { getBankRates } from '@/lib/financial/InterestRates';
import type { ExtendedConsortiumProduct } from '@/hooks/useConsortiumProducts';

const SimulacaoConsorcio = () => {
  const { settings } = useSimulationSettings();
  const [creditValue, setCreditValue] = useState<number>(50000);
  const [consortiumTerm, setConsortiumTerm] = useState<number>(180);
  const [financingTerm, setFinancingTerm] = useState<number>(180);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [assetType, setAssetType] = useState<'vehicle' | 'real_estate'>('vehicle');
  const [selectedProduct, setSelectedProduct] = useState<ExtendedConsortiumProduct | null>(null);
  const [adminRate, setAdminRate] = useState<number>(18);
  const [fundRate, setFundRate] = useState<number>(0.15);
  const [selectedBank, setSelectedBank] = useState<string>('CAIXA');
  const [financingRate, setFinancingRate] = useState<number>(1.12);

  // Gerar opções de parcelas de 125 a 420 meses
  const generateInstallmentOptions = () => {
    const options = [];
    
    // Adicionar opções principais de 125 a 420 meses (intervalos de 5 ou 10)
    for (let i = 125; i <= 180; i += 5) {
      options.push(i);
    }
    for (let i = 180; i <= 240; i += 10) {
      options.push(i);
    }
    for (let i = 240; i <= 300; i += 20) {
      options.push(i);
    }
    for (let i = 300; i <= 420; i += 30) {
      options.push(i);
    }
    
    return options;
  };

  const installmentOptions = generateInstallmentOptions();

  // Atualizar dados quando um produto for selecionado
  useEffect(() => {
    if (selectedProduct) {
      setConsortiumTerm(selectedProduct.installments);
      setAdminRate(selectedProduct.administration_fee);
      setFundRate(selectedProduct.reserve_fund_rate || 0.15);
      
      // Se há faixa de crédito definida, usar valor médio
      if (selectedProduct.min_credit_value && selectedProduct.max_credit_value) {
        setCreditValue((selectedProduct.min_credit_value + selectedProduct.max_credit_value) / 2);
      }
    }
  }, [selectedProduct]);

  // Inicializar taxa do banco padrão
  useEffect(() => {
    const bankRates = getBankRates();
    const defaultBank = bankRates.find(b => b.name === 'CAIXA');
    if (defaultBank) {
      setFinancingRate(defaultBank.monthlyRate);
    }
  }, []);

  const handleBankSelect = (bankName: string, rate: number) => {
    setSelectedBank(bankName);
    setFinancingRate(rate);
  };

  // Cálculos com nova implementação
  const priceCalculation = FinancingCalculator.calculatePrice(
    creditValue - downPayment,
    financingRate,
    financingTerm
  );
  
  const sacCalculation = FinancingCalculator.calculateSAC(
    creditValue - downPayment,
    financingRate,
    financingTerm
  );
  
  const consortiumCalculation = ConsortiumCalculator.calculate({
    assetValue: creditValue,
    installments: consortiumTerm,
    downPayment,
    adminRate,
    fundRate
  });

  const ComparisonCard = ({ 
    title, 
    monthlyPayment, 
    totalAmount, 
    totalInterest, 
    highlight = false,
    badge,
    icon,
    additionalInfo
  }: {
    title: string;
    monthlyPayment: number;
    totalAmount: number;
    totalInterest: number;
    highlight?: boolean;
    badge?: string;
    icon?: React.ReactNode;
    additionalInfo?: string;
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
        {additionalInfo && (
          <CardDescription className="text-xs text-muted-foreground">
            {additionalInfo}
          </CardDescription>
        )}
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
            <Label className="text-muted-foreground">Total de Juros/Taxas</Label>
            <p className="font-semibold text-destructive">{formatCurrency(totalInterest)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Simulação de Consórcio</h1>
            <p className="text-gray-600">
              Compare consórcio com financiamento tradicional - Nova fórmula implementada
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Valor do Crédito</p>
                  <p className="text-lg font-bold">{formatCurrency(creditValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Prazo Consórcio</p>
                  <p className="text-lg font-bold">{consortiumTerm} meses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Taxa Admin</p>
                  <p className="text-lg font-bold">{adminRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Economia vs {selectedBank}</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(priceCalculation.totalAmount - consortiumCalculation.totalCost)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Formulário de Simulação */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Dados da Simulação
              </CardTitle>
              <CardDescription>
                Configure os parâmetros da simulação
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

              <ProductSelector
                category={assetType === 'vehicle' ? 'automovel' : 'imovel'}
                onProductSelect={setSelectedProduct}
                selectedProduct={selectedProduct}
              />

              <div>
                <Label htmlFor="creditValue">Valor do Crédito</Label>
                <Input
                  id="creditValue"
                  type="number"
                  value={creditValue}
                  onChange={(e) => setCreditValue(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="downPayment">Valor de Entrada/Lance</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              {/* Seção de Prazos - SEMPRE DISPONÍVEL */}
              <div className="border-t pt-4">
                <Label className="text-base font-medium">Configurações de Prazo</Label>
                
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="consortiumTerm">Prazo do Consórcio (meses)</Label>
                    <Select value={consortiumTerm.toString()} onValueChange={(value) => setConsortiumTerm(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {installmentOptions.map((months) => (
                          <SelectItem key={months} value={months.toString()}>
                            {months} meses ({(months / 12).toFixed(1)} anos)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="financingTerm">Prazo do Financiamento (meses)</Label>
                    <Select value={financingTerm.toString()} onValueChange={(value) => setFinancingTerm(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {installmentOptions.map((months) => (
                          <SelectItem key={months} value={months.toString()}>
                            {months} meses ({(months / 12).toFixed(1)} anos)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="adminRate">Taxa Administração (%)</Label>
                <Input
                  id="adminRate"
                  type="number"
                  step="0.01"
                  value={adminRate}
                  onChange={(e) => setAdminRate(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nova fórmula: Valor × (1 + Taxa) ÷ Parcelas
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Taxa Admin. Consórcio: {adminRate}%</p>
                  <p>Banco Selecionado: {selectedBank}</p>
                  <p>Taxa Financiamento: {financingRate.toFixed(2)}% a.m.</p>
                  <p>Prazo Consórcio: {consortiumTerm} meses</p>
                  <p>Prazo Financiamento: {financingTerm} meses</p>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <Save className="w-4 h-4 mr-2" />
                Registrar Orçamento
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          <div className="lg:col-span-3 space-y-6">
            {/* Opções de Financiamento */}
            <BankFinancingOptions
              selectedBank={selectedBank}
              onBankSelect={handleBankSelect}
            />

            {/* Análise de Lance */}
            {downPayment > 0 && (
              <ConsortiumBidAnalysis
                downPayment={downPayment}
                creditValue={creditValue}
                minimumBidPercentages={[25, 50]}
              />
            )}

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
                additionalInfo="Nova fórmula: Valor × (1 + Taxa) ÷ Parcelas"
              />
              
              <ComparisonCard
                title={`Financiamento ${selectedBank}`}
                monthlyPayment={priceCalculation.monthlyPayment}
                totalAmount={priceCalculation.totalAmount}
                totalInterest={priceCalculation.totalInterest}
                icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
                additionalInfo="Sistema PRICE - Parcelas fixas"
              />
              
              <ComparisonCard
                title="Financiamento SAC"
                monthlyPayment={sacCalculation.monthlyPayment}
                totalAmount={sacCalculation.totalAmount}
                totalInterest={sacCalculation.totalInterest}
                icon={<TrendingDown className="h-4 w-4 text-purple-600" />}
                additionalInfo="Primeira parcela (parcelas decrescentes)"
              />
            </div>

            {/* Extrato Detalhado */}
            <ConsortiumDetailedStatement
              consortiumData={consortiumCalculation}
              financingData={priceCalculation}
            />

            {/* Detalhes do Consórcio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informações Detalhadas - Nova Fórmula
                </CardTitle>
                <CardDescription>
                  Cálculo corrigido: Valor × (1 + Taxa Admin) ÷ Parcelas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Carta de Crédito</Label>
                    <p className="text-lg font-semibold">{formatCurrency(consortiumCalculation.creditLetter)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Valor + Taxa Admin</Label>
                    <p className="text-lg font-semibold">{formatCurrency(creditValue * (1 + adminRate / 100))}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Parcela Calculada</Label>
                    <p className="text-lg font-semibold">{formatCurrency(consortiumCalculation.monthlyPayment)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Economia vs {selectedBank}</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(priceCalculation.totalAmount - consortiumCalculation.totalCost)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Exemplo da Nova Fórmula:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Valor: R$ {formatCurrency(creditValue)} × (1 + {adminRate}%) = R$ {formatCurrency(creditValue * (1 + adminRate / 100))}</p>
                    <p>• Dividido por {consortiumTerm} parcelas = R$ {formatCurrency((creditValue * (1 + adminRate / 100)) / consortiumTerm)}</p>
                    <p>• Prazos independentes: Consórcio ({consortiumTerm}m) e Financiamento ({financingTerm}m)</p>
                    <p>• Layout padronizado conforme outras telas do sistema</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulacaoConsorcio;
