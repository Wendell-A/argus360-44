import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConversionRateSummary } from '@/hooks/useConversionRateSummary';
import { Target, TrendingUp, Users, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConversionRateWidgetProps {
  startDate?: string;
  endDate?: string;
  officeId?: string;
}

export function ConversionRateWidget({ startDate, endDate, officeId }: ConversionRateWidgetProps) {
  const { data, isLoading, error } = useConversionRateSummary({ startDate, endDate, officeId });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Taxa de Conversão do Funil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Taxa de Conversão do Funil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold">Erro ao carregar dados de conversão</p>
              <p className="text-sm">
                Para usar este widget, certifique-se de:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                <li>Configurar as etapas <strong>inicial</strong> e <strong>final</strong> do funil em <strong>/crm</strong></li>
                <li>Criar uma meta de conversão ativa para o escritório no período em <strong>/metas</strong></li>
                <li>Selecionar um escritório válido nos filtros do dashboard</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const hasGoal = data.conversion_goal > 0;
  const hasData = data.total_entered > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Taxa de Conversão do Funil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conversões Atuais vs Meta */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                {data.current_conversions}
              </span>
              {hasGoal && (
                <span className="text-lg text-muted-foreground">
                  / {data.conversion_goal}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Conversões</div>
              {hasGoal && (
                <div className={`text-lg font-semibold ${
                  data.progress_percentage >= 100 
                    ? 'text-green-600' 
                    : data.progress_percentage >= 70 
                    ? 'text-yellow-600' 
                    : 'text-muted-foreground'
                }`}>
                  {data.progress_percentage.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {hasGoal && (
            <Progress 
              value={Math.min(data.progress_percentage, 100)} 
              className="h-2"
            />
          )}
          
          {!hasGoal && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
                Crie uma meta de conversão em <strong>/metas</strong> para acompanhar o progresso
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Métricas Secundárias */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Taxa de Conversão
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {hasData ? `${data.conversion_rate.toFixed(1)}%` : '0%'}
            </div>
            <div className="text-xs text-muted-foreground">
              {hasData ? 'do funil completo' : 'Sem dados no período'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Clientes Iniciados
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {data.total_entered}
            </div>
            <div className="text-xs text-muted-foreground">
              entraram no funil
            </div>
          </div>
        </div>

        {/* Informação sobre Configuração */}
        {!hasData && (
          <Alert className="bg-muted/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Configure as etapas <strong>inicial</strong> e <strong>final</strong> do funil em <strong>/crm</strong> para começar a medir conversões
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
