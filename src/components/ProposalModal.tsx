import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCreateProposal } from '@/hooks/useProposals';
import { formatCurrency } from '@/lib/utils';

interface SimulationData {
  creditValue: number;
  monthlyPayment: number;
  term: number;
  productId: string;
  adminRate: number;
}

interface ProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulationData: SimulationData;
}

export function ProposalModal({ open, onOpenChange, simulationData }: ProposalModalProps) {
  const { activeTenant, user } = useAuth();
  const createProposal = useCreateProposal();
  
  // Fase do formulário: 1 = Cliente, 2 = Orçamento
  const [phase, setPhase] = useState<1 | 2>(1);
  const [clientId, setClientId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados do cliente (Fase 1)
  const [clientData, setClientData] = useState({
    name: '',
    type: 'individual' as 'individual' | 'company',
    document: '',
    email: '',
    phone: '',
  });

  // Dados do orçamento (Fase 2)
  const [proposalData, setProposalData] = useState({
    data_da_simulacao: new Date().toISOString().split('T')[0],
    taxa_comissao_escritorio: simulationData.adminRate || 0,
    taxa_comissao_vendedor: 0,
  });

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeTenant?.tenant_id) {
      toast.error('Tenant não encontrado');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar office_id do tenant_users
      const { data: tenantUserData, error: tenantUserError } = await supabase
        .from('tenant_users')
        .select('office_id')
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenant.tenant_id)
        .single();

      if (tenantUserError || !tenantUserData?.office_id) {
        throw new Error('Escritório não encontrado');
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          tenant_id: activeTenant.tenant_id,
          office_id: tenantUserData.office_id,
          name: clientData.name,
          type: clientData.type,
          document: clientData.document,
          email: clientData.email,
          phone: clientData.phone,
          status: 'prospect',
          classification: 'warm',
        })
        .select()
        .single();

      if (error) throw error;

      setClientId(data.id);
      setPhase(2);
      toast.success('Cliente cadastrado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error('Erro ao cadastrar cliente: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error('Cliente não encontrado');
      return;
    }

    setIsSubmitting(true);

    try {
      await createProposal.mutateAsync({
        client_id: clientId,
        product_id: simulationData.productId,
        valor_da_simulacao: simulationData.creditValue,
        valor_da_parcela: simulationData.monthlyPayment,
        prazo: simulationData.term,
        data_da_simulacao: proposalData.data_da_simulacao,
        taxa_comissao_escritorio: proposalData.taxa_comissao_escritorio,
        taxa_comissao_vendedor: proposalData.taxa_comissao_vendedor,
      });

      // Reset e fechar
      handleClose();
    } catch (error: any) {
      console.error('Erro ao registrar orçamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPhase(1);
    setClientId('');
    setClientData({
      name: '',
      type: 'individual',
      document: '',
      email: '',
      phone: '',
    });
    setProposalData({
      data_da_simulacao: new Date().toISOString().split('T')[0],
      taxa_comissao_escritorio: simulationData.adminRate || 0,
      taxa_comissao_vendedor: 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {phase === 1 ? 'Cadastrar Cliente' : 'Registrar Orçamento'}
          </DialogTitle>
          <DialogDescription>
            {phase === 1 
              ? 'Fase 1 de 2: Cadastre os dados básicos do cliente'
              : 'Fase 2 de 2: Confirme os dados do orçamento'
            }
          </DialogDescription>
        </DialogHeader>

        {phase === 1 ? (
          <form onSubmit={handleClientSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  required
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={clientData.type}
                  onValueChange={(value: 'individual' | 'company') =>
                    setClientData({ ...clientData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Pessoa Física</SelectItem>
                    <SelectItem value="company">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">
                  {clientData.type === 'individual' ? 'CPF' : 'CNPJ'} *
                </Label>
                <Input
                  id="document"
                  value={clientData.document}
                  onChange={(e) => setClientData({ ...clientData, document: e.target.value })}
                  required
                  placeholder={clientData.type === 'individual' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  required
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  required
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Próxima Etapa'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProposalSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor da Carta de Crédito</Label>
                <Input
                  value={formatCurrency(simulationData.creditValue)}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor da Parcela</Label>
                <Input
                  value={formatCurrency(simulationData.monthlyPayment)}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo (meses)</Label>
                <Input
                  value={simulationData.term}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_da_simulacao">Data da Simulação *</Label>
                <Input
                  id="data_da_simulacao"
                  type="date"
                  value={proposalData.data_da_simulacao}
                  onChange={(e) =>
                    setProposalData({ ...proposalData, data_da_simulacao: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxa_comissao_escritorio">Taxa Comissão Escritório (%) *</Label>
                <Input
                  id="taxa_comissao_escritorio"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={proposalData.taxa_comissao_escritorio}
                  onChange={(e) =>
                    setProposalData({
                      ...proposalData,
                      taxa_comissao_escritorio: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxa_comissao_vendedor">Taxa Comissão Vendedor (%) *</Label>
                <Input
                  id="taxa_comissao_vendedor"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={proposalData.taxa_comissao_vendedor}
                  onChange={(e) =>
                    setProposalData({
                      ...proposalData,
                      taxa_comissao_vendedor: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPhase(1)}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar Orçamento'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
