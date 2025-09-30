import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";

type Defaulter = Database['public']['Tables']['defaulters']['Row'];

const defaulterSchema = z.object({
  empresa: z.string().optional(),
  cod_revenda: z.string().optional(),
  ata: z.string().optional(),
  revenda: z.string().optional(),
  data_contabilizacao: z.string().optional(),
  data_alocacao: z.string().optional(),
  proposta: z.string().optional(),
  cod_grupo: z.string().optional(),
  cota: z.coerce.number().optional(),
  sequencia: z.coerce.number().optional(),
  cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
  tipo_cota: z.string().optional(),
  bem_descricao: z.string().optional(),
  prazo_cota_meses: z.coerce.number().optional(),
  parcelas_pagas: z.coerce.number().optional(),
  parcelas_vencidas: z.coerce.number().optional(),
  status_cota: z.string().optional(),
  situacao_cobranca: z.string().optional(),
  valor_bem_venda: z.coerce.number().optional(),
  valor_bem_atual: z.coerce.number().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type DefaulterFormData = z.infer<typeof defaulterSchema>;

interface DefaulterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  defaulter?: Defaulter | null;
}

export function DefaulterModal({
  isOpen,
  onClose,
  onSave,
  defaulter,
}: DefaulterModalProps) {
  const form = useForm<DefaulterFormData>({
    resolver: zodResolver(defaulterSchema),
    defaultValues: {
      cliente_nome: "",
      telefone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (defaulter) {
      form.reset({
        empresa: defaulter.empresa || "",
        cod_revenda: defaulter.cod_revenda || "",
        ata: defaulter.ata || "",
        revenda: defaulter.revenda || "",
        data_contabilizacao: defaulter.data_contabilizacao || "",
        data_alocacao: defaulter.data_alocacao || "",
        proposta: defaulter.proposta || "",
        cod_grupo: defaulter.cod_grupo || "",
        cota: defaulter.cota || undefined,
        sequencia: defaulter.sequencia || undefined,
        cliente_nome: defaulter.cliente_nome || "",
        tipo_cota: defaulter.tipo_cota || "",
        bem_descricao: defaulter.bem_descricao || "",
        prazo_cota_meses: defaulter.prazo_cota_meses || undefined,
        parcelas_pagas: defaulter.parcelas_pagas || undefined,
        parcelas_vencidas: defaulter.parcelas_vencidas || undefined,
        status_cota: defaulter.status_cota || "",
        situacao_cobranca: defaulter.situacao_cobranca || "",
        valor_bem_venda: defaulter.valor_bem_venda ? Number(defaulter.valor_bem_venda) : undefined,
        valor_bem_atual: defaulter.valor_bem_atual ? Number(defaulter.valor_bem_atual) : undefined,
        telefone: defaulter.telefone || "",
        email: defaulter.email || "",
      });
    } else {
      form.reset({
        cliente_nome: "",
        telefone: "",
        email: "",
      });
    }
  }, [defaulter, form]);

  const handleSubmit = (data: DefaulterFormData) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaulter ? "Editar Inadimplente" : "Novo Inadimplente"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dados da Cota */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">Dados da Cota</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="proposta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposta</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cod_grupo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Grupo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cota</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ATA</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo_cota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cota</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status_cota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status da Cota</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dados de Inadimplência */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">Dados de Inadimplência</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="parcelas_pagas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas Pagas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parcelas_vencidas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas Vencidas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="situacao_cobranca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação de Cobrança</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dados Financeiros */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">Dados Financeiros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor_bem_venda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Venda</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor_bem_atual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Atual</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {defaulter ? "Salvar Alterações" : "Criar Inadimplente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
