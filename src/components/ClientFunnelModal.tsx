import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CalendarIcon, TrendingUp, Target, DollarSign, Percent, User, ShoppingCart, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  useSalesFunnelStages, 
  useUpdateClientFunnelPosition,
  useClientFunnelHistory 
} from "@/hooks/useSalesFunnel";
import { useClientSalesHistory, useProductSuggestions } from "@/hooks/useClientSalesHistory";
import { toast } from "@/hooks/use-toast";

const clientFunnelSchema = z.object({
  stage_id: z.string().min(1, "Fase é obrigatória"),
  probability: z.number().min(0, "Probabilidade não pode ser negativa").max(100, "Probabilidade não pode ser maior que 100"),
  expected_value: z.number().min(0, "Valor esperado não pode ser negativo"),
  estimated_close_date: z.date().optional(),
  notes: z.string().optional(),
});

type ClientFunnelFormData = z.infer<typeof clientFunnelSchema>;

interface ClientFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    classification: string;
    status: string;
    probability?: number;
    expected_value?: number;
    stage_id?: string;
    entered_at?: string;
    estimated_close_date?: string;
    notes?: string;
  } | null;
  mode: "edit" | "view";
}

export function ClientFunnelModal({ isOpen, onClose, client, mode }: ClientFunnelModalProps) {
  const { stages, isLoading: stagesLoading } = useSalesFunnelStages();
  const { updatePositionAsync, isUpdating } = useUpdateClientFunnelPosition();
  const { history } = useClientFunnelHistory(client?.id);
  const { data: salesHistory, isLoading: salesHistoryLoading } = useClientSalesHistory(client?.id);
  const { data: suggestions, isLoading: suggestionsLoading } = useProductSuggestions(client?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFunnelFormData>({
    resolver: zodResolver(clientFunnelSchema),
    defaultValues: {
      stage_id: "",
      probability: 0,
      expected_value: 0,
      estimated_close_date: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (client && isOpen) {
      form.reset({
        stage_id: client.stage_id || "",
        probability: client.probability || 0,
        expected_value: client.expected_value || 0,
        estimated_close_date: client.estimated_close_date ? new Date(client.estimated_close_date) : undefined,
        notes: client.notes || "",
      });
    }
  }, [client, isOpen, form]);

  const onSubmit = async (data: ClientFunnelFormData) => {
    if (!client) return;
    
    setIsSubmitting(true);
    try {
      await updatePositionAsync({
        clientId: client.id,
        stageId: data.stage_id,
        probability: data.probability,
        expectedValue: data.expected_value,
        notes: data.notes,
      });
      
      toast({
        title: "Posição no funil atualizada",
        description: "Os dados do cliente no funil foram atualizados com sucesso.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a posição no funil.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStage = stages.find(stage => stage.id === client?.stage_id);
  const isReadOnly = mode === "view";

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "hot": return "bg-red-500 text-white border-red-500";
      case "warm": return "bg-yellow-500 text-white border-yellow-500";
      case "cold": return "bg-blue-500 text-white border-blue-500";
      default: return "bg-gray-500 text-white border-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-600 text-white border-green-600";
      case "prospect": return "bg-blue-600 text-white border-blue-600";
      case "inactive": return "bg-gray-600 text-white border-gray-600";
      default: return "bg-gray-600 text-white border-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {mode === "edit" && "Editar Posição no Funil"}
            {mode === "view" && "Visualizar Posição no Funil"}
          </DialogTitle>
        </DialogHeader>

        {client && (
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Informações do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{client.name}</p>
                </div>
                {client.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Badge className={getClassificationColor(client.classification)}>
                    {client.classification === "hot" && "Quente"}
                    {client.classification === "warm" && "Morno"}
                    {client.classification === "cold" && "Frio"}
                  </Badge>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status === "active" && "Ativo"}
                    {client.status === "prospect" && "Prospect"}
                    {client.status === "inactive" && "Inativo"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Posição Atual no Funil */}
            {currentStage && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Posição Atual</h3>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: currentStage.color }}
                  />
                  <span className="font-medium">{currentStage.name}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    {client.probability || 0}%
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    R$ {(client.expected_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="funnel" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="funnel">Configurações do Funil</TabsTrigger>
                <TabsTrigger value="sales">Vendas & Sugestões</TabsTrigger>
              </TabsList>
              
              <TabsContent value="funnel" className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Configurações do Funil */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Configurações do Funil
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stage_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fase do Funil</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly || stagesLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma fase" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: stage.color }}
                                    />
                                    {stage.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="probability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probabilidade de Fechamento (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              max="100"
                              step="1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isReadOnly}
                              placeholder="0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expected_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Esperado (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              disabled={isReadOnly}
                              placeholder="0,00" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimated_close_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Estimada de Fechamento</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isReadOnly}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Observações</h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas sobre a posição no funil</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            disabled={isReadOnly} 
                            placeholder="Adicione observações sobre o progresso do cliente no funil de vendas..."
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Histórico */}
                {history && history.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Histórico no Funil</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {history.map((position, index) => {
                        const stage = stages.find(s => s.id === position.stage_id);
                        return (
                          <div key={position.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage?.color || '#gray' }}
                            />
                            <span className="font-medium">{stage?.name || 'Fase desconhecida'}</span>
                            <span className="text-sm text-muted-foreground">
                              {position.entered_at ? format(new Date(position.entered_at), "dd/MM/yyyy", { locale: ptBR }) : ''}
                            </span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">Atual</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                    {!isReadOnly && (
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isUpdating}>
                          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </DialogFooter>
                    )}
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="sales" className="space-y-6">
                {/* Histórico de Vendas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Histórico de Vendas
                  </h3>
                  
                  {salesHistoryLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : salesHistory && salesHistory.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {salesHistory.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                          <div>
                             <p className="font-medium">Venda #{sale.id?.slice(0, 8)}</p>
                             <p className="text-sm text-muted-foreground">
                               Status: {sale.status || 'N/A'}
                             </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {sale.sale_value ? `R$ ${sale.sale_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {sale.sale_date ? format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR }) : 'Data não informada'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma venda encontrada para este cliente.
                    </p>
                  )}
                </div>
                
                {/* Sugestões de Produtos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Sugestões de Produtos
                  </h3>
                  
                  {suggestionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : suggestions && suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestions.map((product) => (
                        <div key={product.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Categoria: {product.category}
                          </p>
                           <p className="text-sm">
                             Valor: R$ {product.min_credit_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 'N/A'}
                           </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma sugestão disponível no momento.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}