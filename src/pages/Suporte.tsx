import { useState } from 'react';
import { Plus, Filter, Search, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useSupportTickets, 
  useSupportTicketsStats,
  SupportTicketStatus, 
  SupportTicketPriority,
  SupportTicketCategory 
} from '@/hooks/useSupportTickets';
import { SupportTicketModal } from '@/components/SupportTicketModal';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabels: Record<SupportTicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  pending_user: 'Aguardando Usuário',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

const statusColors: Record<SupportTicketStatus, string> = {
  open: 'destructive',
  in_progress: 'default',
  pending_user: 'secondary',
  resolved: 'outline',
  closed: 'outline'
};

const priorityLabels: Record<SupportTicketPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const priorityColors: Record<SupportTicketPriority, string> = {
  low: 'outline',
  normal: 'secondary',
  high: 'default',
  urgent: 'destructive'
};

const categoryLabels: Record<SupportTicketCategory, string> = {
  bug: 'Bug/Erro',
  feature_request: 'Nova Funcionalidade',
  technical_support: 'Suporte Técnico',
  account: 'Conta',
  billing: 'Faturamento',
  training: 'Treinamento',
  other: 'Outros'
};

export default function Suporte() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<SupportTicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SupportTicketCategory | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Construir filtros para a query
  const filters = {
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    priority: priorityFilter !== 'all' ? [priorityFilter] : undefined,
    category: categoryFilter !== 'all' ? [categoryFilter] : undefined,
  };

  const { data: tickets = [], isLoading } = useSupportTickets(filters);
  const { data: stats } = useSupportTicketsStats();

  // Filtrar por termo de busca
  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openTickets = filteredTickets.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'pending_user');
  const closedTickets = filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Portal de Suporte</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus chamados e solicitações de suporte
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Chamado
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total de Chamados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.open + stats.in_progress}</p>
                  <p className="text-xs text-muted-foreground">Abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
                  <p className="text-xs text-muted-foreground">Resolvidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-8 h-8 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.closed}</p>
                  <p className="text-xs text-muted-foreground">Fechados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar chamados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">Chamados Abertos ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="closed">Chamados Finalizados ({closedTickets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="open" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="text-muted-foreground">Carregando chamados...</div>
            </div>
          ) : openTickets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum chamado aberto</h3>
                <p className="text-muted-foreground mb-4">
                  Você não possui chamados em aberto no momento.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Chamado
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {openTickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-foreground">{ticket.title}</h3>
                          <Badge variant={statusColors[ticket.status] as any}>
                            {statusLabels[ticket.status]}
                          </Badge>
                          <Badge variant={priorityColors[ticket.priority] as any}>
                            {priorityLabels[ticket.priority]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Categoria: {categoryLabels[ticket.category]}</span>
                          <span>
                            Criado {formatDistanceToNow(new Date(ticket.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="closed" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="text-muted-foreground">Carregando chamados...</div>
            </div>
          ) : closedTickets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum chamado finalizado</h3>
                <p className="text-muted-foreground">
                  Você ainda não possui chamados finalizados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {closedTickets.map((ticket) => (
                <Card 
                  key={ticket.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-foreground">{ticket.title}</h3>
                          <Badge variant={statusColors[ticket.status] as any}>
                            {statusLabels[ticket.status]}
                          </Badge>
                          <Badge variant={priorityColors[ticket.priority] as any}>
                            {priorityLabels[ticket.priority]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Categoria: {categoryLabels[ticket.category]}</span>
                          <span>
                            Finalizado {formatDistanceToNow(new Date(ticket.resolved_at || ticket.closed_at || ticket.updated_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showCreateModal && (
        <SupportTicketModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      
      {selectedTicketId && (
        <SupportTicketModal
          open={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketId={selectedTicketId}
        />
      )}
    </div>
  );
}