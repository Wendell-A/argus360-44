
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toLocalISOString, fromLocalISOString } from "@/lib/dateUtils";
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
import { DatePickerImproved } from "@/components/ui/date-picker-improved";
import { 
  useCreateClient, 
  useUpdateClient,
  Client 
} from "@/hooks/useClients";
import { useOffices } from "@/hooks/useOffices";
import { useUserContext } from "@/hooks/useUserContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["individual", "company"], { required_error: "Tipo é obrigatório" }),
  document: z.string().min(1, "Documento é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  secondary_phone: z.string().optional(),
  birth_date: z.date().optional(),
  status: z.enum(["prospect", "active", "inactive"]),
  classification: z.enum(["hot", "warm", "cold"]),
  monthly_income: z.number().min(0, "Renda não pode ser negativa").optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
  office_id: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipcode: z.string().optional(),
  }).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  mode: "create" | "edit" | "view";
}

export function ClientModal({ isOpen, onClose, client, mode }: ClientModalProps) {
  const { createClientAsync, isCreating } = useCreateClient();
  const { updateClientAsync, isUpdating } = useUpdateClient();
  const { offices, isLoading: isLoadingOffices } = useOffices();
  const { userContext } = useUserContext();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      type: "individual",
      document: "",
      email: "",
      phone: "",
      secondary_phone: "",
      birth_date: undefined,
      status: "prospect",
      classification: "cold",
      monthly_income: 0,
      occupation: "",
      notes: "",
      office_id: "",
      address: {
        street: "",
        number: "",
        complement: "",
        district: "",
        city: "",
        state: "",
        zipcode: "",
      },
    },
  });

  useEffect(() => {
    if (client && isOpen) {
      console.log('🔄 [DEBUG] Carregando dados do cliente no modal:', {
        clientId: client.id,
        clientName: client.name,
        birthDateOriginal: client.birth_date,
        birthDateType: typeof client.birth_date,
        mode: mode
      });

      const address = typeof client.address === 'object' && client.address ? client.address as any : {};
      const birthDate = client.birth_date ? fromLocalISOString(client.birth_date) : undefined;
      
      console.log('📅 [DEBUG] Processando birth_date:', {
        originalValue: client.birth_date,
        dateObject: birthDate,
        dateString: birthDate ? birthDate.toISOString() : 'undefined',
        formattedDisplay: birthDate ? birthDate.toLocaleDateString('pt-BR') : 'undefined'
      });

      form.reset({
        name: client.name,
        type: client.type as "individual" | "company",
        document: client.document,
        email: client.email || "",
        phone: client.phone || "",
        secondary_phone: client.secondary_phone || "",
        birth_date: birthDate,
        status: client.status as "prospect" | "active" | "inactive",
        classification: client.classification as "hot" | "warm" | "cold",
        monthly_income: client.monthly_income || 0,
        occupation: client.occupation || "",
        notes: client.notes || "",
        office_id: client.office_id || "",
        address: {
          street: address.street || "",
          number: address.number || "",
          complement: address.complement || "",
          district: address.district || "",
          city: address.city || "",
          state: address.state || "",
          zipcode: address.zipcode || "",
        },
      });

      // Validação pós-carregamento
      setTimeout(() => {
        const formBirthDate = form.getValues('birth_date');
        console.log('✅ [DEBUG] Validação após carregamento:', {
          formValue: formBirthDate,
          originalValue: client.birth_date,
          match: (formBirthDate ? toLocalISOString(formBirthDate) : undefined) === client.birth_date
        });
      }, 100);

    } else if (!client && isOpen) {
      console.log('➕ [DEBUG] Abrindo modal para criar novo cliente');
      form.reset({
        name: "",
        type: "individual",
        document: "",
        email: "",
        phone: "",
        secondary_phone: "",
        birth_date: undefined,
        status: "prospect",
        classification: "cold",
        monthly_income: 0,
        occupation: "",
        notes: "",
        office_id: "",
        address: {
          street: "",
          number: "",
          complement: "",
          district: "",
          city: "",
          state: "",
          zipcode: "",
        },
      });
    }
  }, [client, isOpen, form, mode]);

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    
    // Verificar se usuário tem acesso a algum escritório
    const accessibleOffices = userContext?.accessible_offices || [];
    const selectedOfficeId = data.office_id || (accessibleOffices.length === 1 ? accessibleOffices[0] : null);
    
    console.log('💾 [DEBUG] Iniciando processo de salvar cliente:', {
      mode: mode,
      clientId: client?.id,
      userId: user?.id,
      selectedOfficeId,
      accessibleOffices,
      userRole: userContext?.role,
      formBirthDate: data.birth_date,
      birthDateToSave: data.birth_date ? data.birth_date.toISOString().split('T')[0] : null
    });

    try {
      // Validação de escritório para usuários não admin/owner
      if (!userContext?.is_owner_or_admin && !selectedOfficeId) {
        throw new Error("Você precisa selecionar um escritório válido para criar clientes.");
      }
      // Validate birth_date before saving
      if (data.birth_date) {
        const today = new Date();
        const minDate = new Date("1900-01-01");
        if (data.birth_date > today || data.birth_date < minDate) {
          throw new Error(`Data de aniversário inválida: ${data.birth_date.toLocaleDateString('pt-BR')}`);
        }
      }

      // Ensure all required fields are present and properly typed
      const submitData = {
        name: data.name,
        type: data.type,
        document: data.document,
        email: data.email || null,
        phone: data.phone || null,
        secondary_phone: data.secondary_phone || null,
        birth_date: data.birth_date ? (() => {
          const localDate = toLocalISOString(data.birth_date);
          console.log('🎂 DEBUG: Data de aniversário - conversão detalhada:', {
            original: data.birth_date,
            originalISO: data.birth_date.toISOString(),
            originalDay: data.birth_date.getDate(),
            originalMonth: data.birth_date.getMonth() + 1,
            originalYear: data.birth_date.getFullYear(),
            converted: localDate,
            convertedDay: localDate.split('-')[2],
            convertedMonth: localDate.split('-')[1],
            convertedYear: localDate.split('-')[0]
          });
          return localDate;
        })() : null,
        status: data.status,
        classification: data.classification,
        monthly_income: data.monthly_income || null,
        occupation: data.occupation || null,
        notes: data.notes || null,
        office_id: selectedOfficeId,
        responsible_user_id: user?.id,
        address: data.address || null,
      };

      console.log('📤 [DEBUG] Dados que serão enviados ao servidor:', submitData);

      let result;
      if (mode === "edit" && client) {
        result = await updateClientAsync({ id: client.id, ...submitData });
        
        // Validação cruzada pós-save para modo edição
        if (result && data.birth_date) {
          const savedBirthDate = result.birth_date;
          const expectedBirthDate = toLocalISOString(data.birth_date);
          
          console.log('🔍 [DEBUG] Validação cruzada pós-save (edição):', {
            expected: expectedBirthDate,
            saved: savedBirthDate,
            match: savedBirthDate === expectedBirthDate
          });

          if (savedBirthDate !== expectedBirthDate) {
            console.error('❌ [ERRO] Data de aniversário não foi salva corretamente!');
            toast({
              title: "Atenção",
              description: `Data de aniversário pode não ter sido salva corretamente. Esperado: ${data.birth_date.toLocaleDateString('pt-BR')}, Salvo: ${savedBirthDate}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Cliente atualizado",
              description: data.birth_date 
                ? `Cliente atualizado! Aniversário: ${data.birth_date.toLocaleDateString('pt-BR')}`
                : "O cliente foi atualizado com sucesso.",
            });
          }
        } else {
          toast({
            title: "Cliente atualizado",
            description: "O cliente foi atualizado com sucesso.",
          });
        }
      } else if (mode === "create") {
        result = await createClientAsync(submitData);
        
        // Validação cruzada pós-save para modo criação
        if (result && data.birth_date) {
          const savedBirthDate = result.birth_date;
          const expectedBirthDate = toLocalISOString(data.birth_date);
          
          console.log('🔍 [DEBUG] Validação cruzada pós-save (criação):', {
            expected: expectedBirthDate,
            saved: savedBirthDate,
            match: savedBirthDate === expectedBirthDate
          });

          toast({
            title: "Cliente criado",
            description: data.birth_date 
              ? `Cliente criado! Aniversário: ${data.birth_date.toLocaleDateString('pt-BR')}`
              : "O cliente foi criado com sucesso.",
          });
        } else {
          toast({
            title: "Cliente criado",
            description: "O cliente foi criado com sucesso.",
          });
        }
      }

      console.log('✅ [DEBUG] Cliente salvo com sucesso:', result);
      onClose();
    } catch (error: any) {
      console.error('❌ [ERROR] Erro ao salvar cliente:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });

      // Melhor tratamento de erros do Supabase
      let errorMessage = "Erro desconhecido";
      if (error?.message) {
        errorMessage = error.message;
        // Mapear mensagens específicas de RLS
        if (error.message.includes("row-level security policy")) {
          errorMessage = "Você não tem permissão para criar clientes neste escritório. Verifique se seu usuário está associado a um escritório válido.";
        }
        if (error.message.includes("violates check constraint")) {
          errorMessage = "Dados inválidos fornecidos. Verifique os campos obrigatórios.";
        }
      }

      toast({
        title: "Erro ao salvar cliente",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Novo Cliente"}
            {mode === "edit" && "Editar Cliente"}
            {mode === "view" && "Visualizar Cliente"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="Nome completo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">Pessoa Física</SelectItem>
                          <SelectItem value="company">Pessoa Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="000.000.000-00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classificação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hot">Quente</SelectItem>
                          <SelectItem value="warm">Morno</SelectItem>
                          <SelectItem value="cold">Frio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                 />

                 <FormField
                   control={form.control}
                   name="birth_date"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Data de Aniversário</FormLabel>
                       <FormControl>
                         <DatePickerImproved
                           value={field.value}
                           onChange={field.onChange}
                           disabled={isReadOnly}
                           placeholder="Selecione uma data"
                           minDate={new Date("1900-01-01")}
                           maxDate={new Date()}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* Campo Escritório */}
                 <FormField
                   control={form.control}
                   name="office_id"
                   render={({ field }) => {
                     const accessibleOffices = userContext?.accessible_offices || [];
                     const filteredOffices = offices.filter(office => 
                       userContext?.is_owner_or_admin || accessibleOffices.includes(office.id)
                     );
                     
                     // Auto-selecionar se o usuário tiver apenas 1 escritório acessível
                     const shouldAutoSelect = filteredOffices.length === 1 && !field.value && mode === "create";
                     if (shouldAutoSelect) {
                       field.onChange(filteredOffices[0].id);
                     }
                     
                     // Se o usuário não tem acesso a nenhum escritório
                     if (filteredOffices.length === 0 && !userContext?.is_owner_or_admin) {
                       return (
                         <FormItem>
                           <FormLabel>Escritório</FormLabel>
                           <div className="text-sm text-destructive">
                             Sua conta não está associada a um escritório. Contate um administrador.
                           </div>
                         </FormItem>
                       );
                     }
                     
                     return (
                       <FormItem>
                         <FormLabel>Escritório {!userContext?.is_owner_or_admin && "*"}</FormLabel>
                         <Select 
                           onValueChange={field.onChange} 
                           value={field.value} 
                           disabled={isReadOnly || isLoadingOffices || filteredOffices.length === 1}
                         >
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder={
                                 isLoadingOffices 
                                   ? "Carregando escritórios..." 
                                   : filteredOffices.length === 1 
                                     ? filteredOffices[0].name
                                     : "Selecione um escritório"
                               } />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             {filteredOffices.map((office) => (
                               <SelectItem key={office.id} value={office.id}>
                                 {office.name}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     );
                   }}
                 />
               </div>
             </div>

             {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} type="email" placeholder="email@exemplo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="(11) 99999-9999" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Secundário</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="(11) 99999-9999" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Informações Profissionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Profissionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="Profissão" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthly_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renda Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
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
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="Nome da rua" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="Apto, sala, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="address.district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="Bairro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="Cidade" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="SP" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isReadOnly} placeholder="00000-000" />
                      </FormControl>
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
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={isReadOnly} placeholder="Observações sobre o cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isReadOnly && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || isCreating || isUpdating}>
                  {isSubmitting ? "Salvando..." : mode === "create" ? "Criar" : "Salvar"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
