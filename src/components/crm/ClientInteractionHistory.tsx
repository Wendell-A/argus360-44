
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, User, MessageCircle, Phone, Mail, CheckCircle } from 'lucide-react';
import { useClientInteractions } from '@/hooks/useClientInteractions';
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

export function ClientInteractionHistory({ clientId }: ClientInteractionHistoryProps) {
  const { interactions, isLoading } = useClientInteractions(clientId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Carregando histórico...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Histórico de Interações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nenhuma interação registrada ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Histórico de Interações ({interactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="border-l-2 border-gray-200 pl-3 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getInteractionIcon(interaction.interaction_type)}
                    <span className="font-medium text-sm">{interaction.title}</span>
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
      </CardContent>
    </Card>
  );
}
