import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Proposal {
  id: string;
  tenant_id: string;
  office_id: string;
  client_id: string;
  product_id: string;
  valor_da_simulacao: number;
  valor_da_parcela: number;
  prazo: number;
  data_da_simulacao: string;
  taxa_comissao_escritorio: number;
  taxa_comissao_vendedor: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProposalInput {
  client_id: string;
  product_id: string;
  valor_da_simulacao: number;
  valor_da_parcela: number;
  prazo: number;
  data_da_simulacao: string;
  taxa_comissao_escritorio: number;
  taxa_comissao_vendedor: number;
}

export const useProposals = () => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['proposals', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!activeTenant?.tenant_id,
  });
};

export interface ProposalWithClient extends Proposal {
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
}

export const useProposalsWithClient = () => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['proposals-with-client', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      const { data, error } = await supabase
        .from('proposals_with_client_info')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProposalWithClient[];
    },
    enabled: !!activeTenant?.tenant_id,
  });
};

export const useProposalsTotalValue = () => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['proposals-total', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      const { data, error } = await supabase
        .from('proposals')
        .select('valor_da_simulacao')
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) throw error;
      
      const total = data.reduce((acc, proposal) => acc + Number(proposal.valor_da_simulacao), 0);
      return total;
    },
    enabled: !!activeTenant?.tenant_id,
  });
};

export const useUpdateProposal = () => {
  const { activeTenant } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proposal> & { id: string }) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', activeTenant.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-with-client'] });
      toast.success('Orçamento atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar orçamento:', error);
      toast.error('Erro ao atualizar orçamento: ' + error.message);
    },
  });
};

export const useDeleteProposal = () => {
  const { activeTenant } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id)
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-with-client'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-total'] });
      toast.success('Orçamento excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir orçamento:', error);
      toast.error('Erro ao excluir orçamento: ' + error.message);
    },
  });
};

export const useCreateProposal = () => {
  const { activeTenant, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

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
        .from('proposals')
        .insert({
          tenant_id: activeTenant.tenant_id,
          office_id: tenantUserData.office_id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-with-client'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-total'] });
      toast.success('Orçamento registrado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar orçamento:', error);
      toast.error('Erro ao registrar orçamento: ' + error.message);
    },
  });
};
