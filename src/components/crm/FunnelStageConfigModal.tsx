import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { useUpdateFunnelStageConfig, useClearFunnelStageConfig } from '@/hooks/useFunnelStageConfig';
import type { SalesFunnelStage } from '@/hooks/useSalesFunnel';

interface FunnelStageConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: SalesFunnelStage[];
}

export function FunnelStageConfigModal({
  open,
  onOpenChange,
  stages,
}: FunnelStageConfigModalProps) {
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  
  const updateConfig = useUpdateFunnelStageConfig();
  const clearConfig = useClearFunnelStageConfig();

  useEffect(() => {
    // Sincronizar estado local com dados das etapas
    const initialStage = stages.find((s) => s.is_initial_stage);
    const finalStage = stages.find((s) => s.is_final_stage);
    
    setSelectedInitial(initialStage?.id || null);
    setSelectedFinal(finalStage?.id || null);
  }, [stages]);

  const handleInitialToggle = async (stageId: string, checked: boolean) => {
    if (checked) {
      setSelectedInitial(stageId);
      await updateConfig.mutateAsync({
        stageId,
        isInitialStage: true,
        isFinalStage: stageId === selectedFinal,
      });
    } else {
      setSelectedInitial(null);
      await clearConfig.mutateAsync(stageId);
    }
  };

  const handleFinalToggle = async (stageId: string, checked: boolean) => {
    if (checked) {
      setSelectedFinal(stageId);
      await updateConfig.mutateAsync({
        stageId,
        isFinalStage: true,
        isInitialStage: stageId === selectedInitial,
      });
    } else {
      setSelectedFinal(null);
      await clearConfig.mutateAsync(stageId);
    }
  };

  const hasCompleteConfig = selectedInitial && selectedFinal && selectedInitial !== selectedFinal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Configurar Funil de Conversão
          </DialogTitle>
          <DialogDescription>
            Defina quais etapas representam o início e o fim do seu funil de vendas para medir a taxa de conversão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informação sobre Conversão */}
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
              A <strong>taxa de conversão</strong> mede quantos clientes que entraram na <strong>etapa inicial</strong> 
              conseguiram chegar até a <strong>etapa final</strong> do seu funil.
            </AlertDescription>
          </Alert>

          {/* Status da Configuração */}
          {hasCompleteConfig && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                Configuração completa! Você pode criar metas de conversão em <strong>/metas</strong> e 
                acompanhar o progresso no dashboard.
              </AlertDescription>
            </Alert>
          )}

          {!hasCompleteConfig && (selectedInitial || selectedFinal) && (
            <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                Selecione ambas as etapas (inicial e final) para ativar o cálculo de conversão.
              </AlertDescription>
            </Alert>
          )}

          {/* Lista de Etapas */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Etapas do Funil</h3>
            
            {stages.map((stage) => {
              const isInitial = selectedInitial === stage.id;
              const isFinal = selectedFinal === stage.id;
              
              return (
                <Card 
                  key={stage.id}
                  className={`transition-all ${
                    isInitial || isFinal 
                      ? 'border-primary shadow-sm' 
                      : 'border-border'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stage.color || '#gray' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{stage.name}</h4>
                            {isInitial && (
                              <Badge variant="secondary" className="text-xs">
                                Início
                              </Badge>
                            )}
                            {isFinal && (
                              <Badge variant="secondary" className="text-xs">
                                Fim
                              </Badge>
                            )}
                          </div>
                          {stage.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {stage.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`initial-${stage.id}`} className="text-xs cursor-pointer">
                            Etapa Inicial
                          </Label>
                          <Switch
                            id={`initial-${stage.id}`}
                            checked={isInitial}
                            onCheckedChange={(checked) => handleInitialToggle(stage.id, checked)}
                            disabled={updateConfig.isPending || clearConfig.isPending}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Label htmlFor={`final-${stage.id}`} className="text-xs cursor-pointer">
                            Etapa Final
                          </Label>
                          <Switch
                            id={`final-${stage.id}`}
                            checked={isFinal}
                            onCheckedChange={(checked) => handleFinalToggle(stage.id, checked)}
                            disabled={updateConfig.isPending || clearConfig.isPending}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Botão de Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
