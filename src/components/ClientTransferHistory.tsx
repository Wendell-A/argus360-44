import { useClientTransfers } from "@/hooks/useClientTransfers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientTransferHistoryProps {
  clientId: string;
}

export function ClientTransferHistory({ clientId }: ClientTransferHistoryProps) {
  const { data: transfers = [], isLoading } = useClientTransfers(clientId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico de Repasses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (transfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico de Repasses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este cliente ainda não foi repassado entre vendedores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Histórico de Repasses
          <Badge variant="secondary" className="ml-auto">
            {transfers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {transfer.from_user?.full_name || 'Usuário removido'}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {transfer.to_user?.full_name || 'Usuário removido'}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {format(new Date(transfer.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
              <Badge
                variant={transfer.status === 'completed' ? 'default' : 'secondary'}
                className="mt-1"
              >
                {transfer.status === 'completed' ? 'Concluído' : 'Pendente'}
              </Badge>
            </div>
          </div>
        ))}

        {/* Detalhes do repasse mais recente */}
        {transfers[0] && (transfers[0].reason || transfers[0].notes) && (
          <div className="rounded-lg border p-3 bg-muted/10">
            <h4 className="text-sm font-medium mb-2">Detalhes do último repasse:</h4>
            {transfers[0].reason && (
              <p className="text-xs text-muted-foreground mb-1">
                <strong>Motivo:</strong> {transfers[0].reason}
              </p>
            )}
            {transfers[0].notes && (
              <p className="text-xs text-muted-foreground">
                <strong>Observações:</strong> {transfers[0].notes}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}