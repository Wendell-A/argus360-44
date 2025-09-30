import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Defaulter = Database['public']['Tables']['defaulters']['Row'];
type DefaulterInsert = Database['public']['Tables']['defaulters']['Insert'];
type DefaulterUpdate = Database['public']['Tables']['defaulters']['Update'];

interface DefaultersListResponse {
  data: Defaulter[];
  total_count: number;
}

interface UseDefaultersOptions {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  statusFilter?: string;
  situacaoFilter?: string;
}

export const useDefaulters = (options: UseDefaultersOptions = {}) => {
  const {
    pageNumber = 1,
    pageSize = 10,
    searchTerm,
    statusFilter,
    situacaoFilter,
  } = options;

  return useQuery({
    queryKey: ['defaulters', pageNumber, pageSize, searchTerm, statusFilter, situacaoFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_defaulters_list', {
        p_page_number: pageNumber,
        p_page_size: pageSize,
        p_search_term: searchTerm || null,
        p_status_filter: statusFilter || null,
        p_situacao_filter: situacaoFilter || null,
      });

      if (error) throw error;
      
      return data as unknown as DefaultersListResponse;
    },
  });
};

export const useCreateDefaulter = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (defaulter: DefaulterInsert) => {
      const { data, error } = await supabase
        .from('defaulters')
        .insert(defaulter)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defaulters'] });
      toast({
        title: "Inadimplente cadastrado",
        description: "O registro foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateDefaulter = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: DefaulterUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('defaulters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defaulters'] });
      toast({
        title: "Inadimplente atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteDefaulter = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('defaulters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defaulters'] });
      toast({
        title: "Inadimplente excluído",
        description: "O registro foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
