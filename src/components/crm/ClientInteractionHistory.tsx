
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, User, MessageCircle, Phone, Mail, CheckCircle, Search, Filter, X } from 'lucide-react';
import { useContextualInteractions } from '@/hooks/useContextualInteractions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientInteractionHistoryProps {
  clientId: string;
}

const getInteractionIcon = (type: string) => {
  switch (type) {
    case 'whatsapp':
      return <MessageCircle className="w-4 h-4" />;
    case 'call':
      return <Phone className="w-4 h-4" />;
    case 'email':
      return <Mail className="w-4 h-4" />;
    case 'meeting':
      return <User className="w-4 h-4" />;
    default:
      return <MessageCircle className="w-4 h-4" />;
  }
};

const getOutcomeColor = (outcome: string) => {
  switch (outcome) {
    case 'positive':
      return 'bg-green-100 text-green-800';
    case 'negative':
      return 'bg-red-100 text-red-800';
    case 'neutral':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getInteractionTypeLabel = (type: string) => {
  const types = {
    'whatsapp': 'WhatsApp',
    'call': 'Ligação',
    'email': 'E-mail',
    'meeting': 'Reunião',
    'visit': 'Visita',
    'proposal_sent': 'Proposta Enviada',
    'follow_up': 'Follow-up'
  };
  return types[type as keyof typeof types] || type;
};

export function ClientInteractionHistory({ clientId }: ClientInteractionHistoryProps) {
  const { data: interactions = [], isLoading } = useContextualInteractions(clientId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      const matchesSearch = searchTerm === '' || 
        interaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (interaction.description && interaction.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || interaction.interaction_type === filterType;
      const matchesPriority = filterPriority === 'all' || interaction.priority === filterPriority;
      const matchesOutcome = filterOutcome === 'all' || interaction.outcome === filterOutcome;

      return matchesSearch && matchesType && matchesPriority && matchesOutcome;
    });
  }, [interactions, searchTerm, filterType, filterPriority, filterOutcome]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterPriority('all');
    setFilterOutcome('all');
  };

  const hasActiveFilters = searchTerm !== '' || filterType !== 'all' || filterPriority !== 'all' || filterOutcome !== 'all';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Carregando histórico...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Histórico de Interações ({filteredInteractions.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-red-600"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar nas interações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Tipo</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="visit">Visita</SelectItem>
                    <SelectItem value="proposal_sent">Proposta Enviada</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Prioridade</label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Resultado</label>
                <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="positive">Positivo</SelectItem>
                    <SelectItem value="negative">Negativo</SelectItem>
                    <SelectItem value="neutral">Neutro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredInteractions.length === 0 ? (
          <p className="text-sm text-gray-500">
            {interactions.length === 0 
              ? "Nenhuma interação registrada ainda." 
              : "Nenhuma interação encontrada com os filtros aplicados."
            }
          </p>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {filteredInteractions.map((interaction) => (
                <div key={interaction.id} className="border-l-2 border-gray-200 pl-3 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInteractionIcon(interaction.interaction_type)}
                      <span className="font-medium text-sm">{interaction.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {getInteractionTypeLabel(interaction.interaction_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={getPriorityColor(interaction.priority)}>
                        {interaction.priority}
                      </Badge>
                      {interaction.outcome && (
                        <Badge className={getOutcomeColor(interaction.outcome)}>
                          {interaction.outcome}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {interaction.description && (
                    <p className="text-sm text-gray-600 mb-2">{interaction.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(interaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                    {interaction.status === 'completed' && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        Concluída
                      </div>
                    )}
                  </div>
                  
                  {interaction.next_action && interaction.next_action_date && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <span className="font-medium">Próxima ação:</span> {interaction.next_action}
                      <br />
                      <span className="text-xs text-gray-600">
                        Data prevista: {format(new Date(interaction.next_action_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
