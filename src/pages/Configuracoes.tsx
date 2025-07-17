import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { useSimulationSettings } from '@/hooks/useSimulationSettings';
import { Calculator } from 'lucide-react';
import { getDefaultRates } from '@/lib/financial/InterestRates';

const Configuracoes = () => {
  const { settings, updateSettings, isUpdating } = useSimulationSettings();
  const [simulationSettings, setSimulationSettings] = useState(settings);

  useEffect(() => {
    setSimulationSettings(settings);
  }, [settings]);

  const handleSaveSimulationSettings = () => {
    updateSettings(simulationSettings);
  };

  const resetToDefaults = () => {
    const defaults = getDefaultRates();
    setSimulationSettings(defaults);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="simulacao">Simulação</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Configurações gerais em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulacao" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                <div>
                  <CardTitle>Configurações de Simulação</CardTitle>
                  <CardDescription>
                    Configure as taxas de juros e parâmetros para simulações
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Taxas de Financiamento</h4>
                  
                  <div>
                    <Label htmlFor="vehicleRate">Financiamento de Veículos (%/mês)</Label>
                    <Input
                      id="vehicleRate"
                      type="number"
                      step="0.01"
                      value={simulationSettings.vehicleFinancingRate}
                      onChange={(e) => setSimulationSettings(prev => ({
                        ...prev,
                        vehicleFinancingRate: Number(e.target.value)
                      }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa média atual no mercado: 1.99% a.m.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="realEstateRate">Financiamento Imobiliário (%/mês)</Label>
                    <Input
                      id="realEstateRate"
                      type="number"
                      step="0.01"
                      value={simulationSettings.realEstateFinancingRate}
                      onChange={(e) => setSimulationSettings(prev => ({
                        ...prev,
                        realEstateFinancingRate: Number(e.target.value)
                      }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa média atual no mercado: 0.85% a.m.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Taxas de Consórcio</h4>
                  
                  <div>
                    <Label htmlFor="consortiumAdmin">Taxa de Administração (%/mês)</Label>
                    <Input
                      id="consortiumAdmin"
                      type="number"
                      step="0.01"
                      value={simulationSettings.consortiumAdminRate}
                      onChange={(e) => setSimulationSettings(prev => ({
                        ...prev,
                        consortiumAdminRate: Number(e.target.value)
                      }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa típica: 0.25% a.m.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="consortiumFund">Taxa do Fundo (%/mês)</Label>
                    <Input
                      id="consortiumFund"
                      type="number"
                      step="0.01"
                      value={simulationSettings.consortiumFundRate}
                      onChange={(e) => setSimulationSettings(prev => ({
                        ...prev,
                        consortiumFundRate: Number(e.target.value)
                      }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa típica: 0.15% a.m.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p>Última atualização: {new Date(simulationSettings.lastUpdated).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={resetToDefaults}>
                    Restaurar Padrões
                  </Button>
                  <Button 
                    onClick={handleSaveSimulationSettings}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure suas preferências de notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Configurações de notificações em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Configurações de segurança e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Configurações de segurança em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
