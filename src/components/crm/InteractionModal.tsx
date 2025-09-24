
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Copy, Send, Calendar, Clock } from 'lucide-react';
import { useCreateClientInteraction } from '@/hooks/useClientInteractions';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { openWhatsApp, copyWhatsAppLink, parseMessageTemplate } from '@/lib/whatsapp';
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

const interactionTypeOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'visit', label: 'Visita' },
  { value: 'proposal_sent', label: 'Proposta Enviada' },
  { value: 'follow_up', label: 'Follow-up' },
];

export function InteractionModal({ isOpen, onClose, client }: InteractionModalProps) {
  const [formData, setFormData] = useState({
    interaction_type: 'whatsapp' as const,
    title: '',
    description: '',
    priority: 'medium' as const,
    status: 'completed' as const,
    next_action: '',
    next_action_date: '',
    next_action_type: '',
    next_action_title: '',
    next_action_description: '',
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

  const handleNextActionChange = () => {
    // Construir a próxima ação baseada nos campos separados
    if (formData.next_action_type && formData.next_action_title) {
      const actionTypeLabel = interactionTypeOptions.find(opt => opt.value === formData.next_action_type)?.label || formData.next_action_type;
      const nextAction = `${actionTypeLabel}: ${formData.next_action_title}`;
      
      setFormData(prev => ({
        ...prev,
        next_action: nextAction
      }));
    }
  };

  useEffect(() => {
    handleNextActionChange();
  }, [formData.next_action_type, formData.next_action_title]);

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

    // Validar próxima ação se preenchida
    if (formData.next_action_type && (!formData.next_action_title.trim() || !formData.next_action_date)) {
      toast({
        title: "Erro",
        description: "Para próxima ação, é necessário preencher tipo, título e data.",
        variant: "destructive",
      });
      return;
    }

    // Validar se a data da próxima ação não é anterior a hoje
    if (formData.next_action_date) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.next_action_date < today) {
        toast({
          title: "Erro",
          description: "A data da próxima ação não pode ser anterior a hoje.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      console.log('Submitting interaction data:', {
        client_id: client.id,
        interaction_type: formData.interaction_type,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        next_action: formData.next_action || null,
        next_action_date: formData.next_action_date || null,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      });

      // Criar a interação principal
      await createInteractionAsync({
        client_id: client.id,
        interaction_type: formData.interaction_type,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        next_action: formData.next_action || null,
        next_action_date: formData.next_action_date || null,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      });

      // Se há próxima ação definida, criar uma tarefa automaticamente
      if (formData.next_action_type && formData.next_action_title && formData.next_action_date && client.id) {
        console.log('Creating automatic task for next action:', {
          client_id: client.id,
          task_type: formData.next_action_type,
          title: formData.next_action_title,
          description: formData.next_action_description,
          priority: formData.priority,
          due_date: formData.next_action_date,
        });

        try {
          // Criar tarefa para a próxima ação
          await createInteractionAsync({
            client_id: client.id,
            interaction_type: formData.next_action_type,
            title: formData.next_action_title,
            description: formData.next_action_description || `Tarefa criada automaticamente: ${formData.next_action_title}`,
            priority: formData.priority,
            status: 'pending',
            next_action: `${interactionTypeOptions.find(opt => opt.value === formData.next_action_type)?.label}: ${formData.next_action_title}`,
            next_action_date: formData.next_action_date,
            scheduled_at: new Date(formData.next_action_date).toISOString(),
          });

          console.log('Automatic task created successfully');
        } catch (taskError) {
          console.error('Error creating automatic task:', taskError);
          toast({
            title: "Aviso",
            description: "Interação salva, mas houve problema ao criar a tarefa automática.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Interação registrada com sucesso." + (formData.next_action_type ? " Tarefa criada automaticamente." : ""),
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
      next_action_type: '',
      next_action_title: '',
      next_action_description: '',
    });
    setParsedMessage('');
    setSelectedTemplate('');
  };

  const handleWhatsAppSend = () => {
    if (!client?.phone || !parsedMessage) return;
    
    openWhatsApp(client.phone, parsedMessage);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Interação - {client.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção da Interação Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interação Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      {interactionTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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
            </CardContent>
          </Card>

          {/* Seção da Próxima Ação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Próxima Ação (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="next_action_type">Tipo da Próxima Ação</Label>
                  <Select
                    value={formData.next_action_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, next_action_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {interactionTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="next_action_date">Data da Próxima Ação</Label>
                  <Input
                    id="next_action_date"
                    type="date"
                    value={formData.next_action_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_action_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="next_action_title">Título da Próxima Ação</Label>
                <Input
                  id="next_action_title"
                  value={formData.next_action_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_action_title: e.target.value }))}
                  placeholder="Ex: Agendar reunião para apresentar proposta"
                />
              </div>

              <div>
                <Label htmlFor="next_action_description">Descrição da Próxima Ação</Label>
                <Textarea
                  id="next_action_description"
                  value={formData.next_action_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_action_description: e.target.value }))}
                  placeholder="Descreva detalhes da próxima ação..."
                  rows={2}
                />
              </div>

              {formData.next_action && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm text-blue-800">Prévia da Tarefa:</span>
                  </div>
                  <p className="text-sm text-blue-700">{formData.next_action}</p>
                  {formData.next_action_date && (
                    <p className="text-xs text-blue-600 mt-1">
                      Data: {new Date(formData.next_action_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
