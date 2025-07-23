import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, MessageCircle, Mail, Plus } from 'lucide-react';
import { useSalesFunnelStages, useClientFunnelPositions, useUpdateClientFunnelPosition } from '@/hooks/useSalesFunnel';
import { generateWhatsAppLink, formatPhoneNumber } from '@/lib/whatsapp';
import { InteractionModal } from './InteractionModal';
import { useToast } from '@/hooks/use-toast';

interface ClientCard {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  classification: string;
  status: string;
  probability: number;
  expected_value: number;
  entered_at: string;
}

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
  clients: ClientCard[];
}

interface SalesFunnelBoardProps {
  onClientSelect?: (clientId: string) => void;
}

export function SalesFunnelBoard({ onClientSelect }: SalesFunnelBoardProps) {
  const { stages, isLoading: stagesLoading } = useSalesFunnelStages();
  const { positions, isLoading: positionsLoading, refetch } = useClientFunnelPositions();
  const { updatePositionAsync } = useUpdateClientFunnelPosition();
  const [selectedClient, setSelectedClient] = useState<ClientCard | null>(null);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // Organizar dados por fase
  const funnelData: FunnelStage[] = stages.map(stage => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    order_index: stage.order_index,
    clients: positions
      .filter(pos => pos.sales_funnel_stages?.id === stage.id)
      .map(pos => ({
        id: pos.clients?.id || '',
        name: pos.clients?.name || '',
        email: pos.clients?.email || '',
        phone: pos.clients?.phone || '',
        classification: pos.clients?.classification || 'cold',
        status: pos.clients?.status || 'prospect',
        probability: pos.probability || 0,
        expected_value: pos.expected_value || 0,
        entered_at: pos.entered_at || '',
      }))
  }));

  const handleDragStart = (e: React.DragEvent, client: ClientCard) => {
    console.log('Drag started for client:', client);
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify(client));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    console.log('Drag ended');
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    console.log('Drop event on stage:', targetStageId);
    
    try {
      const clientDataStr = e.dataTransfer.getData('application/json');
      if (!clientDataStr) {
        console.error('No client data found in drag event');
        return;
      }

      const clientData = JSON.parse(clientDataStr) as ClientCard;
      console.log('Moving client to stage:', { clientData, targetStageId });
      
      // Verificar se o cliente já está na fase de destino
      const currentPosition = positions.find(pos => pos.clients?.id === clientData.id);
      if (currentPosition?.sales_funnel_stages?.id === targetStageId) {
        console.log('Client is already in target stage');
        return;
      }

      await updatePositionAsync({
        clientId: clientData.id,
        stageId: targetStageId,
        probability: clientData.probability,
        expectedValue: clientData.expected_value,
      });
      
      // Refetch data to update the UI
      await refetch();
      
      toast({
        title: "Cliente movido com sucesso",
        description: `${clientData.name} foi movido para a nova fase.`,
      });
    } catch (error) {
      console.error('Error moving client:', error);
      toast({
        title: "Erro ao mover cliente",
        description: error instanceof Error ? error.message : "Não foi possível mover o cliente para a nova fase.",
        variant: "destructive",
      });
    } finally {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClientClick = (client: ClientCard) => {
    if (onClientSelect) {
      onClientSelect(client.id);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWhatsAppClick = (client: ClientCard) => {
    if (client.phone) {
      const message = `Olá ${client.name}! Como posso ajudá-lo hoje?`;
      const link = generateWhatsAppLink(client.phone, message);
      window.open(link, '_blank');
    }
  };

  const handleInteractionClick = (client: ClientCard) => {
    setSelectedClient(client);
    setIsInteractionModalOpen(true);
  };

  if (stagesLoading || positionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando funil de vendas...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-6">
        {funnelData.map((stage) => (
          <div
            key={stage.id}
            className={`transition-colors duration-200 ${
              isDragging ? 'bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg' : ''
            }`}
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
          >
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle 
                    className="text-sm font-medium"
                    style={{ color: stage.color }}
                  >
                    {stage.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {stage.clients.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto px-4">
                {stage.clients.map((client) => (
                  <Card
                    key={client.id}
                    className="cursor-move hover:shadow-md transition-shadow border-l-4 hover:bg-gray-50"
                    style={{ borderLeftColor: stage.color }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, client)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleClientClick(client)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{client.name}</p>
                            <p className="text-xs text-gray-600">{client.email}</p>
                          </div>
                        </div>
                        <Badge className={getClassificationColor(client.classification)}>
                          {client.classification}
                        </Badge>
                      </div>
                      
                      {client.phone && (
                        <p className="text-xs text-gray-600 mb-2">
                          {formatPhoneNumber(client.phone)}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>Prob: {client.probability}%</span>
                        <span>
                          Valor: R$ {client.expected_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWhatsAppClick(client)}
                          disabled={!client.phone}
                          className="flex-1 p-2 h-8"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${client.phone}`)}
                          disabled={!client.phone}
                          className="flex-1 p-2 h-8"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`mailto:${client.email}`)}
                          disabled={!client.email}
                          className="flex-1 p-2 h-8"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInteractionClick(client)}
                          className="flex-1 p-2 h-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {stage.clients.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-10 px-4 border-2 border-dashed border-gray-200 rounded-lg">
                    Nenhum cliente nesta fase
                    {isDragging && (
                      <p className="text-xs mt-2">Solte o cliente aqui</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <InteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        client={selectedClient}
      />
    </div>
  );
}
