
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Building2, DollarSign, TrendingUp, Target, Settings, FileText } from 'lucide-react';
import { FinancingCalculator } from '@/lib/financial/FinancingCalculator';
import { ConsortiumCalculator } from '@/lib/financial/ConsortiumCalculator';
import { formatCurrency } from '@/lib/utils';
import { ProductSelector } from '@/components/ProductSelector';
import { BankFinancingOptions } from '@/components/BankFinancingOptions';
import { getBankRates } from '@/lib/financial/InterestRates';
import type { ExtendedConsortiumProduct } from '@/hooks/useConsortiumProducts';

const SimulacaoConsorcio = () => {
  // Estados para Consórcio
  const [consortiumCreditValue, setConsortiumCreditValue] = useState<number>(300000);
  const [consortiumTerm, setConsortiumTerm] = useState<number>(120);
  const [selectedProduct, setSelectedProduct] = useState<ExtendedConsortiumProduct | null>(null);
  const [adminRate, setAdminRate] = useState<number>(18);
  const [inccRate, setInccRate] = useState<number>(0.5);

  // Estados para Financiamento
  const [financingValue, setFinancingValue] = useState<number>(300000);
  const [downPayment, setDownPayment] = useState<number>(105000); // 35% mínimo
  const [financingTerm, setFinancingTerm] = useState<number>(180);
  const [selectedBank, setSelectedBank] = useState<string>('CAIXA');
  const [financingRate, setFinancingRate] = useState<number>(1.12);

  const [assetType, setAssetType] = useState<'vehicle' | 'real_estate'>('real_estate');

  // Gerar opções de parcelas - mínimo 12 meses, máximo 420 meses
  const generateInstallmentOptions = () => {
    const options = [];
    // De 12 a 60 meses, de 12 em 12
    for (let i = 12; i <= 60; i += 12) options.push(i);
    // De 72 a 120 meses, de 12 em 12
    for (let i = 72; i <= 120; i += 12) options.push(i);
    // De 125 a 180 meses, de 5 em 5
    for (let i = 125; i <= 180; i += 5) options.push(i);
    // De 180 a 240 meses, de 10 em 10
    for (let i = 180; i <= 240; i += 10) options.push(i);
    // De 240 a 300 meses, de 20 em 20
    for (let i = 240; i <= 300; i += 20) options.push(i);
    // De 300 a 420 meses, de 30 em 30
    for (let i = 300; i <= 420; i += 30) options.push(i);
    return [...new Set(options)].sort((a, b) => a - b);
  };

  const installmentOptions = generateInstallmentOptions();
  const financingInstallmentOptions = [];
  for (let i = 180; i <= 360; i += 12) financingInstallmentOptions.push(i);

  // Atualizar dados quando um produto for selecionado
  useEffect(() => {
    if (selectedProduct) {
      setConsortiumTerm(selectedProduct.installments);
      setAdminRate(selectedProduct.administration_fee);
      
      if (selectedProduct.min_credit_value && selectedProduct.max_credit_value) {
        setConsortiumCreditValue((selectedProduct.min_credit_value + selectedProduct.max_credit_value) / 2);
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

  // Atualizar entrada mínima quando valor do financiamento mudar
  useEffect(() => {
    const minDownPayment = financingValue * 0.35;
    if (downPayment < minDownPayment) {
      setDownPayment(minDownPayment);
    }
  }, [financingValue, downPayment]);

  const handleBankSelect = (bankName: string, rate: number) => {
    setSelectedBank(bankName);
    setFinancingRate(rate);
  };

  // Cálculos corrigidos
  const consortiumCalculation = ConsortiumCalculator.calculate({
    assetValue: consortiumCreditValue,
    installments: consortiumTerm,
    downPayment: 0,
    adminRate,
    inccRate
  });

  const financingAmount = financingValue - downPayment;
  const priceCalculation = FinancingCalculator.calculatePrice(
    financingAmount,
    financingRate,
    financingTerm
  );

  const economyAmount = priceCalculation.totalAmount - consortiumCalculation.totalCost;

  const handleRegisterQuote = () => {
    // TODO: Implementar modal de registro de orçamento
    console.log('Registrar orçamento');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Simulação de Consórcio</h1>
            <p className="text-muted-foreground">
              Compare consórcio com financiamento tradicional
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
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Consórcio</p>
                  <p className="text-lg font-bold">{formatCurrency(consortiumCalculation.monthlyPayment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Financiamento</p>
                  <p className="text-lg font-bold">{formatCurrency(priceCalculation.monthlyPayment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Economia</p>
                  <p className={`text-lg font-bold ${economyAmount > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(Math.abs(economyAmount))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Banco</p>
                  <p className="text-lg font-bold">{selectedBank}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Seção de Consórcio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Simulação de Consórcio
              </CardTitle>
              <CardDescription>
                Configure os parâmetros do consórcio
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
                <Label htmlFor="consortiumCreditValue">Valor da Carta de Crédito</Label>
                <Input
                  id="consortiumCreditValue"
                  type="number"
                  value={consortiumCreditValue}
                  onChange={(e) => setConsortiumCreditValue(Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="consortiumTerm">Prazo (meses)</Label>
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
                <Label htmlFor="adminRate">Taxa de Administração (%)</Label>
                <Input
                  id="adminRate"
                  type="number"
                  step="0.01"
                  value={adminRate}
                  onChange={(e) => setAdminRate(Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="inccRate">Taxa INCC (% a.a.)</Label>
                <Input
                  id="inccRate"
                  type="number"
                  step="0.01"
                  value={inccRate}
                  onChange={(e) => setInccRate(Number(e.target.value))}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Resultado do Consórcio</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Carta de Crédito:</span>
                    <span className="font-bold">{formatCurrency(consortiumCalculation.creditLetter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcela Mensal:</span>
                    <span className="font-bold">{formatCurrency(consortiumCalculation.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa Administrativa:</span>
                    <span className="font-bold text-destructive">{formatCurrency(consortiumCalculation.totalAdminCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ajuste INCC:</span>
                    <span className="font-bold text-destructive">{formatCurrency(consortiumCalculation.inccAdjustment)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total a Pagar:</span>
                    <span className="font-bold">{formatCurrency(consortiumCalculation.totalCost)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Financiamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                Simulação de Financiamento
              </CardTitle>
              <CardDescription>
                Configure os parâmetros do financiamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="financingValue">Valor do Bem</Label>
                <Input
                  id="financingValue"
                  type="number"
                  value={financingValue}
                  onChange={(e) => setFinancingValue(Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="downPayment">Entrada (mín. 35%)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={downPayment}
                  min={financingValue * 0.35}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo: {formatCurrency(financingValue * 0.35)}
                </p>
              </div>

              <div>
                <Label htmlFor="financingTerm">Prazo (meses)</Label>
                <Select value={financingTerm.toString()} onValueChange={(value) => setFinancingTerm(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {financingInstallmentOptions.map((months) => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} meses ({(months / 12).toFixed(0)} anos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <BankFinancingOptions
                selectedBank={selectedBank}
                onBankSelect={handleBankSelect}
              />

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Resultado do Financiamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Valor do Bem:</span>
                    <span className="font-bold">{formatCurrency(financingValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrada:</span>
                    <span className="font-bold">{formatCurrency(downPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor Financiado:</span>
                    <span className="font-bold">{formatCurrency(financingAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcela Mensal:</span>
                    <span className="font-bold">{formatCurrency(priceCalculation.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Juros:</span>
                    <span className="font-bold text-destructive">{formatCurrency(priceCalculation.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total a Pagar:</span>
                    <span className="font-bold">{formatCurrency(priceCalculation.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Comparação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Comparação de Modalidades
            </CardTitle>
            <CardDescription>
              Análise comparativa entre consórcio e financiamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-semibold text-foreground mb-2">Consórcio</h3>
                <p className="text-2xl font-bold mb-1">{formatCurrency(consortiumCalculation.monthlyPayment)}</p>
                <p className="text-sm text-muted-foreground">parcela mensal</p>
                <p className="text-sm mt-2">Total: {formatCurrency(consortiumCalculation.totalCost)}</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-semibold text-foreground mb-2">Financiamento {selectedBank}</h3>
                <p className="text-2xl font-bold mb-1">{formatCurrency(priceCalculation.monthlyPayment)}</p>
                <p className="text-sm text-muted-foreground">parcela mensal</p>
                <p className="text-sm mt-2">Total: {formatCurrency(priceCalculation.totalAmount)}</p>
              </div>

              <div className={`text-center p-4 border-2 rounded-lg ${economyAmount > 0 ? 'border-primary bg-muted' : 'border-destructive bg-muted'}`}>
                <Target className={`h-8 w-8 mx-auto mb-2 ${economyAmount > 0 ? 'text-primary' : 'text-destructive'}`} />
                <h3 className={`font-semibold mb-2 ${economyAmount > 0 ? 'text-primary' : 'text-destructive'}`}>
                  {economyAmount > 0 ? 'Economia' : 'Diferença'}
                </h3>
                <p className={`text-2xl font-bold mb-1 ${economyAmount > 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(Math.abs(economyAmount))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {economyAmount > 0 ? 'economizando com consórcio' : 'financiamento mais caro'}
                </p>
                <p className="text-sm mt-2">
                  {((Math.abs(economyAmount) / priceCalculation.totalAmount) * 100).toFixed(1)}% de diferença
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button onClick={handleRegisterQuote} size="lg" className="w-full md:w-auto">
                <FileText className="w-4 h-4 mr-2" />
                Registrar Orçamento
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Salve esta simulação e inicie o acompanhamento do cliente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimulacaoConsorcio;
