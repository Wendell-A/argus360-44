import { useState } from 'react';
import { Eye, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TicketDetailModal } from './TicketDetailModal';
import { useAdminSupportTickets } from '@/hooks/useAdminSupport';

const statusLabels: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  pending_user: 'Aguardando Cliente',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const categoryLabels: Record<string, string> = {
  technical_support: 'Suporte Técnico',
  billing: 'Financeiro',
  feature_request: 'Solicitação de Recurso',
  bug: 'Erro/Bug',
  account: 'Conta',
  training: 'Treinamento',
  other: 'Outro',
};

export function TicketList() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
  };

  const { data: tickets, isLoading } = useAdminSupportTickets(filters);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      normal: 'bg-gray-100 text-gray-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.normal;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending_user: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.open;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="pending_user">Aguardando Cliente</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
            <SelectItem value="closed">Fechados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum chamado encontrado
                </TableCell>
              </TableRow>
            ) : (
              tickets?.map((ticket: any) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    #{ticket.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{ticket.tenants?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <span className="font-medium">{ticket.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {categoryLabels[ticket.category] || ticket.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {priorityLabels[ticket.priority] || ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ticket.status)}>
                      {statusLabels[ticket.status] || ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
}
