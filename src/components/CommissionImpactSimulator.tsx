import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Zap
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useVendedores } from '@/hooks/useVendedores';
import { useConsortiumProducts } from '@/hooks/useConsortiumProducts';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: {
    commissionRate: number;
    salesVolume: number;
    averageTicket: number;
    seasonality: number;
  };
}

interface SimulationResult {
  monthlyImpact: number;
  annualImpact: number;
  breakEvenPoint: number;
  roi: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

const predefinedScenarios: SimulationScenario[] = [
  {
    id: 'conservative',
    name: 'Cenário Conservador',
    description: 'Baseado em performance histórica com margem de segurança',
    parameters: {
      commissionRate: 2.0,
      salesVolume: 8,
      averageTicket: 45000,
      seasonality: 0.95
    }
  },
  {
    id: 'optimistic',
    name: 'Cenário Otimista',
    description: 'Projeção com crescimento acima da média',
    parameters: {
      commissionRate: 3.5,
      salesVolume: 15,
      averageTicket: 52000,
      seasonality: 1.15
    }
  },
  {
    id: 'aggressive',
    name: 'Cenário Agressivo',
    description: 'Máxima performance com incentivos elevados',
    parameters: {
      commissionRate: 5.0,
      salesVolume: 20,
      averageTicket: 48000,
      seasonality: 1.25
    }
  }
];

export const CommissionImpactSimulator: React.FC = () => {
  const [selectedSeller, setSelectedSeller] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [customParameters, setCustomParameters] = useState({
    commissionRate: 2.5,
    salesVolume: 10,
    averageTicket: 50000,
    seasonality: 1.0
  });
  const [useCustom, setUseCustom] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { vendedores } = useVendedores();
  const { products } = useConsortiumProducts();

  useEffect(() => {
    if (selectedScenario && !useCustom) {
      const scenario = predefinedScenarios.find(s => s.id === selectedScenario);
      if (scenario) {
        setCustomParameters(scenario.parameters);
      }
    }
  }, [selectedScenario, useCustom]);

  const runSimulation = async () => {
    setIsSimulating(true);
    
    // Simular processamento (em implementação real, chamaria API)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const params = customParameters;
    
    // Cálculos da simulação
    const monthlySales = params.salesVolume * params.seasonality;
    const monthlyRevenue = monthlySales * params.averageTicket;
    const monthlyCommission = monthlyRevenue * (params.commissionRate / 100);
    const annualCommission = monthlyCommission * 12;
    
    // Análise de risco baseada nos parâmetros
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (params.commissionRate > 4.0 || params.salesVolume > 18) {
      riskLevel = 'high';
    } else if (params.commissionRate > 2.5 || params.salesVolume > 12) {
      riskLevel = 'medium';
    }

    // Recomendações baseadas nos resultados
    const recommendations: string[] = [];
    
    if (params.commissionRate < 2.0) {
      recommendations.push('Taxa pode ser baixa para motivar vendedores');
    }
    if (params.salesVolume > 15) {
      recommendations.push('Meta de vendas muito otimista, considere ajuste');
    }
    if (monthlyCommission > 15000) {
      recommendations.push('Alto impacto financeiro, monitore de perto');
    }
    if (riskLevel === 'low') {
      recommendations.push('Cenário equilibrado com boa previsibilidade');
    }

    const result: SimulationResult = {
      monthlyImpact: monthlyCommission,
      annualImpact: annualCommission,
      breakEvenPoint: 3.2, // Meses para equilibrar
      roi: ((annualCommission - (annualCommission * 0.1)) / (annualCommission * 0.1)) * 100,
      riskLevel,
      recommendations
    };

    setSimulationResult(result);
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setSimulationResult(null);
    setSelectedScenario('');
    setUseCustom(false);
    setCustomParameters({
      commissionRate: 2.5,
      salesVolume: 10,
      averageTicket: 50000,
      seasonality: 1.0
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return CheckCircle;
      case 'medium': return AlertCircle;
      case 'high': return TrendingDown;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold">Simulador de Impacto</h3>
          <p className="text-muted-foreground">
            Projete o impacto financeiro de diferentes configurações de comissão
          </p>
        </div>
        <Button variant="outline" onClick={resetSimulation}>
          <Calculator className="h-4 w-4 mr-2" />
          Nova Simulação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuração da Simulação */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Configuração do Cenário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção de contexto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendedor (Opcional)</Label>
                  <Select value={selectedSeller || 'generic'} onValueChange={(value) => setSelectedSeller(value === 'generic' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">Genérico</SelectItem>
                      {vendedores?.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.full_name || vendedor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Produto (Opcional)</Label>
                  <Select value={selectedProduct || 'generic'} onValueChange={(value) => setSelectedProduct(value === 'generic' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">Genérico</SelectItem>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Cenários predefinidos */}
              {!useCustom && (
                <div>
                  <Label>Cenário Predefinido</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    {predefinedScenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedScenario === scenario.id
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedScenario(scenario.id)}
                      >
                        <h4 className="font-semibold text-sm">{scenario.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {scenario.description}
                        </p>
                        <div className="mt-2 text-xs space-y-1">
                          <div>Taxa: {scenario.parameters.commissionRate}%</div>
                          <div>Vendas: {scenario.parameters.salesVolume}/mês</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseCustom(!useCustom)}
                >
                  {useCustom ? 'Usar Cenários Predefinidos' : 'Personalizar Parâmetros'}
                </Button>
              </div>

              {/* Parâmetros customizáveis */}
              {useCustom && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label htmlFor="commissionRate">Taxa de Comissão (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={customParameters.commissionRate}
                      onChange={(e) => setCustomParameters(prev => ({
                        ...prev,
                        commissionRate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="salesVolume">Vendas por Mês</Label>
                    <Input
                      id="salesVolume"
                      type="number"
                      min="1"
                      max="50"
                      value={customParameters.salesVolume}
                      onChange={(e) => setCustomParameters(prev => ({
                        ...prev,
                        salesVolume: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="averageTicket">Ticket Médio (R$)</Label>
                    <Input
                      id="averageTicket"
                      type="number"
                      min="1000"
                      step="1000"
                      value={customParameters.averageTicket}
                      onChange={(e) => setCustomParameters(prev => ({
                        ...prev,
                        averageTicket: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="seasonality">Sazonalidade</Label>
                    <Input
                      id="seasonality"
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="2.0"
                      value={customParameters.seasonality}
                      onChange={(e) => setCustomParameters(prev => ({
                        ...prev,
                        seasonality: parseFloat(e.target.value) || 1.0
                      }))}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={runSimulation} 
                className="w-full"
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Executar Simulação
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {simulationResult ? (
            <>
              {/* Métricas principais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Resultados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Impacto Mensal</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(simulationResult.monthlyImpact)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Impacto Anual</p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(simulationResult.annualImpact)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">ROI Projetado</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {simulationResult.roi.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Análise de Risco */}
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Risco</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-3 rounded-lg border ${getRiskColor(simulationResult.riskLevel)}`}>
                    <div className="flex items-center gap-2">
                      {React.createElement(getRiskIcon(simulationResult.riskLevel), { 
                        className: "h-4 w-4" 
                      })}
                      <span className="font-semibold capitalize">
                        Risco {simulationResult.riskLevel === 'low' ? 'Baixo' : 
                               simulationResult.riskLevel === 'medium' ? 'Médio' : 'Alto'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {simulationResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure os parâmetros e execute a simulação para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};