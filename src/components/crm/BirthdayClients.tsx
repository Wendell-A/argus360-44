import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Gift, 
  Phone, 
  Mail, 
  MessageCircle, 
  Send, 
  CheckCircle2,
  Calendar,
  Cake,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useBirthdayClients, useSendBirthdayMessage, BirthdayClient } from '@/hooks/useBirthdayClients';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { openWhatsApp } from '@/lib/whatsapp';

const getDaysLabel = (days: number) => {
  if (days === 0) return 'Hoje! 🎉';
  if (days === 1) return 'Amanhã';
  if (days === -1) return 'Ontem';
  if (days < 0) return `Há ${Math.abs(days)} dias`;
  return `Em ${days} dias`;
};

const getDaysColor = (days: number) => {
  if (days === 0) return 'bg-red-100 text-red-800';
  if (days <= 2 && days >= 0) return 'bg-orange-100 text-orange-800';
  if (days < 0) return 'bg-gray-100 text-gray-800';
  return 'bg-blue-100 text-blue-800';
};

export function BirthdayClients() {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<BirthdayClient | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  const { data: birthdayClients = [], isLoading, refetch, isFetching } = useBirthdayClients();
  const { templates } = useMessageTemplates();
  const { mutateAsync: sendBirthdayMessage, isPending: isSending } = useSendBirthdayMessage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Encontrar template de felicitações de aniversário
  const birthdayTemplate = templates.find(t => t.name === 'Felicitações de Aniversário');

  const handleSendMessage = async (client: BirthdayClient) => {
    if (!birthdayTemplate) {
      toast({
        title: "Erro",
        description: "Template de aniversário não encontrado.",
        variant: "destructive",
      });
      return;
    }

    // Substituir variáveis no template
    let message = birthdayTemplate.template_text;
    message = message.replace(/{cliente_nome}/g, client.name);
    message = message.replace(/{empresa_nome}/g, 'Nossa Empresa'); // Pode ser dinamizado
    message = message.replace(/{vendedor_nome}/g, 'Vendedor'); // Pode ser dinamizado

    setSelectedClient(client);
    setCustomMessage(message);
    setIsMessageModalOpen(true);
  };

  const confirmSendMessage = async () => {
    if (!selectedClient || !customMessage.trim()) {
      return;
    }

    try {
      await sendBirthdayMessage({
        clientId: selectedClient.id,
        customMessage: customMessage.trim()
      });

      toast({
        title: "Mensagem enviada!",
        description: `Felicitações de aniversário enviadas para ${selectedClient.name}.`,
      });

      setIsMessageModalOpen(false);
      setSelectedClient(null);
      setCustomMessage('');
    } catch (error) {
      console.error('Error sending birthday message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem de aniversário.",
        variant: "destructive",
      });
    }
  };

  const copyWhatsAppLink = () => {
    if (!selectedClient || !customMessage.trim()) return;
    
    const phone = selectedClient.phone.replace(/\D/g, '');
    const message = encodeURIComponent(customMessage.trim());
    const whatsappUrl = `https://wa.me/55${phone}?text=${message}`;
    
    navigator.clipboard.writeText(whatsappUrl).then(() => {
      toast({
        title: "Link copiado!",
        description: "Link do WhatsApp Web copiado para área de transferência.",
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    });
  };

  const openWhatsAppWeb = () => {
    if (!selectedClient || !customMessage.trim()) return;
    
    const phone = selectedClient.phone.replace(/\D/g, '');
    const message = encodeURIComponent(customMessage.trim());
    const whatsappUrl = `https://wa.me/55${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleRefresh = async () => {
    toast({
      title: "Atualizando...",
      description: "Buscando aniversariantes mais recentes.",
    });
    
    try {
      await refetch();
      toast({
        title: "Atualizado!",
        description: "Lista de aniversariantes atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a lista.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Carregando aniversariantes...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-600" />
              <span className="text-pink-800">Aniversariantes (10 dias)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isFetching}
                className="h-6 px-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50"
              >
                <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                {birthdayClients.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {birthdayClients.length === 0 ? (
            <div className="text-center py-6">
              <Cake className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <p className="text-sm text-pink-600 mb-2">Nenhum aniversariante nos próximos 10 dias</p>
              <p className="text-xs text-pink-500 mb-4">
                Busca aniversários dos últimos 3 dias até os próximos 7 dias.
              </p>
              <p className="text-xs text-pink-400">
                Atualiza automaticamente a cada 5 minutos ou clique no botão de atualizar acima.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {birthdayClients.map((client) => (
                  <div 
                    key={client.id} 
                    className={`border rounded-lg p-4 space-y-3 ${
                      client.message_sent 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-pink-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Cake className="w-4 h-4 text-pink-600" />
                          <span className="font-medium text-sm">{client.name}</span>
                        </div>
                        <Badge className={getDaysColor(client.days_until_birthday)}>
                          {getDaysLabel(client.days_until_birthday)}
                        </Badge>
                      </div>
                      
                      {client.message_sent ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs">Enviada</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">Pendente</span>
                        </div>
                      )}
                    </div>

                    {/* Informações de Contato */}
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Aniversário: {format(new Date(client.birth_date), 'dd/MM', { locale: ptBR })}
                      </div>
                    </div>

                    {/* Data de envio da mensagem */}
                    {client.message_sent && client.message_sent_date && (
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        Enviada em: {format(new Date(client.message_sent_date), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                      </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex items-center justify-end gap-2">
                      {!client.message_sent ? (
                        <Button
                          size="sm"
                          onClick={() => handleSendMessage(client)}
                          className="bg-pink-600 hover:bg-pink-700 text-white gap-2"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Enviar Parabéns
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendMessage(client)}
                          className="gap-2"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Nova Mensagem
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de Mensagem */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-600" />
              Mensagem de Aniversário
              {selectedClient && (
                <span className="text-sm text-muted-foreground">- {selectedClient.name}</span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informações do Cliente */}
            {selectedClient && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-pink-600" />
                    <span className="font-medium text-sm">{selectedClient.name}</span>
                  </div>
                  <Badge className={getDaysColor(selectedClient.days_until_birthday)}>
                    {getDaysLabel(selectedClient.days_until_birthday)}
                  </Badge>
                </div>
                
                {selectedClient.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3 h-3" />
                    {selectedClient.phone}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  Aniversário: {format(new Date(selectedClient.birth_date), 'dd/MM', { locale: ptBR })}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="message">Personalizar Mensagem</Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="resize-none"
                placeholder="Digite sua mensagem personalizada..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode editar o texto antes de enviar
              </p>
            </div>

            {/* Preview da mensagem */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm text-green-800">Prévia WhatsApp:</span>
              </div>
              <div className="text-xs text-green-700 whitespace-pre-wrap max-h-20 overflow-y-auto">
                {customMessage || 'Digite uma mensagem...'}
              </div>
            </div>

            {/* Botões de Ação WhatsApp */}
            <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">Opções de Envio</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyWhatsAppLink}
                  disabled={!customMessage.trim() || !selectedClient?.phone}
                  className="w-full gap-2 justify-start"
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Link do WhatsApp Web
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={openWhatsAppWeb}
                  disabled={!customMessage.trim() || !selectedClient?.phone}
                  className="w-full gap-2 justify-start"
                  size="sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir WhatsApp Web
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                Use essas opções para enviar a mensagem pelo WhatsApp Web. Após enviar, marque como enviada abaixo.
              </p>
            </div>

            {/* Botões de Controle */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              <Button
                onClick={confirmSendMessage}
                disabled={isSending || !customMessage.trim()}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSending ? 'Marcando...' : 'Marcar como Enviada'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMessageModalOpen(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              ℹ️ Clique em "Marcar como Enviada" após enviar a mensagem pelo WhatsApp
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}