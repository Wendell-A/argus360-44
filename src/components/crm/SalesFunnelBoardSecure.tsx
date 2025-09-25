import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, MessageCircle, Mail, Plus, ChevronDown, Settings, Shield } from 'lucide-react';
import { useSalesFunnelStages, useClientFunnelPositions, useUpdateClientFunnelPosition } from '@/hooks/useSalesFunnel';
import { openWhatsApp, formatPhoneNumber } from '@/lib/whatsapp';
import { InteractionModal } from './InteractionModal';
import { ClientFunnelModal } from '../ClientFunnelModal';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

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
  responsible_user_id?: string;
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

export function SalesFunnelBoardSecure({ onClientSelect }: SalesFunnelBoardProps) {
  const { stages, isLoading: stagesLoading } = useSalesFunnelStages();
  const { positions, isLoading: positionsLoading, refetch } = useClientFunnelPositions();
  const { updatePositionAsync } = useUpdateClientFunnelPosition();
  const [selectedClient, setSelectedClient] = useState<ClientCard | null>(null);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const [funnelModalMode, setFunnelModalMode] = useState<'edit' | 'view'>('edit');
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { open: sidebarOpen } = useSidebar();
  const { user } = useAuth();

  // Função para verificar se o usuário pode ver o cliente
  const canAccessClient = (client: ClientCard) => {
    // Se não há responsible_user_id, não mostrar (problema crítico de segurança)
    if (!client.responsible_user_id) {
      console.warn('🚨 SEGURANÇA: Cliente sem responsible_user_id encontrado:', client.id);
      return false;
    }
    
    // Usuário pode ver apenas clientes onde é responsável (para role 'user')
    return client.responsible_user_id === user?.id;
  };

  // Filtrar clientes baseado na segurança
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
        responsible_user_id: (pos.clients as any)?.responsible_user_id,
      }))
      .filter(canAccessClient) // Aplicar filtro de segurança
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
      
      // Verificar se o usuário pode mover este cliente
      if (!canAccessClient(clientData)) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para mover este cliente.",
          variant: "destructive",
        });
        return;
      }
      
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
    if (onClientSelect && canAccessClient(client)) {
      onClientSelect(client.id);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'hot': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'warm': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cold': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleWhatsAppClick = (client: ClientCard) => {
    if (client.phone && canAccessClient(client)) {
      const message = `Olá ${client.name}! Como posso ajudá-lo hoje?`;
      openWhatsApp(client.phone, message);
    }
  };

  const handleInteractionClick = (client: ClientCard) => {
    if (canAccessClient(client)) {
      setSelectedClient(client);
      setIsInteractionModalOpen(true);
    }
  };

  const handleFunnelConfigClick = (client: ClientCard) => {
    if (canAccessClient(client)) {
      setSelectedClient(client);
      setFunnelModalMode('edit');
      setIsFunnelModalOpen(true);
    }
  };

  if (stagesLoading || positionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando funil de vendas...</div>
      </div>
    );
  }

  // Grid responsivo que considera o estado da sidebar
  const getGridCols = () => {
    if (sidebarOpen) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3';
    } else {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className="w-full">
      {/* Indicador de segurança */}
      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800 dark:text-green-200">
            Visualização segura ativada - Mostrando apenas seus clientes
          </span>
        </div>
      </div>

      {/* Grid adaptativo baseado no estado da sidebar */}
      <div className={`grid ${getGridCols()} gap-6 pb-6`}>
        {funnelData.map((stage) => (
          <div
            key={stage.id}
            className={`transition-all duration-200 ${
              isDragging ? 'bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg' : ''
            }`}
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
          >
            <Card className="h-full min-w-[280px]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle 
                    className="text-sm font-medium truncate"
                    style={{ color: stage.color }}
                  >
                    {stage.name}
                  </CardTitle>
                  <Badge 
                    variant="secondary"
                    className="shrink-0 ml-2"
                  >
                    {stage.clients.length}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="px-4">
                <div 
                  className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d1d5db transparent'
                  }}
                >
                  {stage.clients.map((client) => (
                    <Card
                      key={client.id}
                      className="cursor-move hover:shadow-lg transition-all duration-300 border-l-4 hover:border-slate-200 dark:hover:border-slate-700 group"
                      style={{ borderLeftColor: stage.color }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, client)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleClientClick(client)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Header do card otimizado */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="text-xs font-medium">
                                {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate" title={client.name}>
                                {client.name}
                              </p>
                              {client.email && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={client.email}>
                                  {client.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={`${getClassificationColor(client.classification)} shrink-0 text-xs`}>
                            {client.classification}
                          </Badge>
                        </div>
                        
                        {/* Telefone */}
                        {client.phone && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {formatPhoneNumber(client.phone)}
                          </div>
                        )}
                        
                        {/* Métricas */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500 dark:text-gray-400">
                              <span className="font-medium">{client.probability}%</span> prob.
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              <span className="font-medium">R$ {client.expected_value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Botões de ação otimizados */}
                        <div className="grid grid-cols-4 gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${client.phone}`);
                            }}
                            disabled={!client.phone}
                            className="h-8 p-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/30"
                            title="Ligar"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`mailto:${client.email}`);
                            }}
                            disabled={!client.email}
                            className="h-8 p-0 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 dark:hover:bg-orange-900/30"
                            title="E-mail"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInteractionClick(client);
                            }}
                            className="h-8 p-0 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 dark:hover:bg-purple-900/30"
                            title="Nova Interação"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFunnelConfigClick(client);
                            }}
                            className="h-8 p-0 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:hover:bg-indigo-900/30"
                            title="Configurar Funil"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Estado vazio otimizado */}
                  {stage.clients.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-12 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                      <div className="space-y-2">
                        <p>Nenhum cliente nesta fase</p>
                        {isDragging && (
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                            <ChevronDown className="w-4 h-4" />
                            <span>Solte o cliente aqui</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
      
      <ClientFunnelModal
        isOpen={isFunnelModalOpen}
        onClose={() => setIsFunnelModalOpen(false)}
        client={selectedClient ? {
          id: selectedClient.id,
          name: selectedClient.name,
          email: selectedClient.email,
          phone: selectedClient.phone,
          classification: selectedClient.classification,
          status: selectedClient.status,
          probability: selectedClient.probability,
          expected_value: selectedClient.expected_value,
          stage_id: funnelData.find(stage => stage.clients.some(c => c.id === selectedClient.id))?.id,
          entered_at: selectedClient.entered_at,
        } : null}
        mode={funnelModalMode}
      />
    </div>
  );
}