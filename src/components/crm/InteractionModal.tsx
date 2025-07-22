
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Copy, Send } from 'lucide-react';
import { useCreateClientInteraction } from '@/hooks/useClientInteractions';
import { useMessageTemplates, parseMessageTemplate } from '@/hooks/useMessageTemplates';
import { generateWhatsAppLink, copyWhatsAppLink } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  } | null;
}

export function InteractionModal({ isOpen, onClose, client }: InteractionModalProps) {
  const [formData, setFormData] = useState({
    interaction_type: 'whatsapp' as const,
    title: '',
    description: '',
    priority: 'medium' as const,
    status: 'completed' as const,
    next_action: '',
    next_action_date: '',
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [parsedMessage, setParsedMessage] = useState('');
  
  const { createInteractionAsync, isCreating } = useCreateClientInteraction();
  const { templates } = useMessageTemplates('whatsapp');
  const { toast } = useToast();

  // Sincronizar descrição com mensagem personalizada quando for WhatsApp
  useEffect(() => {
    if (formData.interaction_type === 'whatsapp' && formData.description) {
      setParsedMessage(formData.description);
    }
  }, [formData.description, formData.interaction_type]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template && client) {
      const variables = {
        cliente_nome: client.name,
        vendedor_nome: 'Vendedor', // TODO: Pegar do contexto do usuário
      };
      
      const parsed = parseMessageTemplate(template.template_text, variables);
      setParsedMessage(parsed);
      setFormData(prev => ({
        ...prev,
        title: template.name,
        description: parsed,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client) {
      toast({
        title: "Erro",
        description: "Cliente não selecionado.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Submitting interaction data:', {
        client_id: client.id,
        ...formData,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      });

      await createInteractionAsync({
        client_id: client.id,
        ...formData,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      });

      toast({
        title: "Sucesso",
        description: "Interação registrada com sucesso.",
      });

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating interaction:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar a interação.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      interaction_type: 'whatsapp',
      title: '',
      description: '',
      priority: 'medium',
      status: 'completed',
      next_action: '',
      next_action_date: '',
    });
    setParsedMessage('');
    setSelectedTemplate('');
  };

  const handleWhatsAppSend = () => {
    if (!client?.phone || !parsedMessage) return;
    
    const link = generateWhatsAppLink(client.phone, parsedMessage);
    window.open(link, '_blank');
  };

  const handleCopyLink = async () => {
    if (!client?.phone || !parsedMessage) return;
    
    try {
      await copyWhatsAppLink(client.phone, parsedMessage);
      toast({
        title: "Link copiado",
        description: "O link do WhatsApp foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Interação - {client.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interaction_type">Tipo de Interação</Label>
              <Select
                value={formData.interaction_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, interaction_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.interaction_type === 'whatsapp' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Templates de WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {parsedMessage && (
                  <div className="space-y-2">
                    <Label>Mensagem Personalizada</Label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{parsedMessage}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleWhatsAppSend}
                        disabled={!client.phone}
                        className="flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Enviar no WhatsApp
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        disabled={!client.phone}
                        className="flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar Link
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Contato inicial sobre consórcio"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">
              Descrição 
              {formData.interaction_type === 'whatsapp' && (
                <span className="text-xs text-gray-500 ml-1">
                  (será usada como mensagem personalizada)
                </span>
              )}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={
                formData.interaction_type === 'whatsapp' 
                  ? "Digite a mensagem que será enviada no WhatsApp..."
                  : "Descreva os detalhes da interação..."
              }
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="next_action">Próxima Ação</Label>
            <Input
              id="next_action"
              value={formData.next_action}
              onChange={(e) => setFormData(prev => ({ ...prev, next_action: e.target.value }))}
              placeholder="Ex: Agendar reunião para apresentar proposta"
            />
          </div>

          <div>
            <Label htmlFor="next_action_date">Data da Próxima Ação</Label>
            <Input
              id="next_action_date"
              type="date"
              value={formData.next_action_date}
              onChange={(e) => setFormData(prev => ({ ...prev, next_action_date: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Salvando...' : 'Salvar Interação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
