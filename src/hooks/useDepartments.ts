
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type Department = Tables<'departments'>;
export type DepartmentInsert = TablesInsert<'departments'>;
export type DepartmentUpdate = TablesUpdate<'departments'>;

export function useDepartments() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['departments', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    departments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (department: Omit<DepartmentInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('departments')
        .insert({ ...department, tenant_id: activeTenant.tenant_id })
        .select()
        .single();

      if (error) throw error;
      return data as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: "Departamento criado",
        description: "O departamento foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating department:', error);
      toast({
        title: "Erro ao criar departamento",
        description: "Não foi possível criar o departamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    createDepartment: mutation.mutate,
    createDepartmentAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ id, ...updates }: DepartmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: "Departamento atualizado",
        description: "O departamento foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating department:', error);
      toast({
        title: "Erro ao atualizar departamento",
        description: "Não foi possível atualizar o departamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    updateDepartment: mutation.mutate,
    updateDepartmentAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: "Departamento excluído",
        description: "O departamento foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting department:', error);
      toast({
        title: "Erro ao excluir departamento",
        description: "Não foi possível excluir o departamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    deleteDepartment: mutation.mutate,
    deleteDepartmentAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
