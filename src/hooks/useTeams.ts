
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type Team = Tables<'teams'>;
export type TeamInsert = TablesInsert<'teams'>;
export type TeamUpdate = TablesUpdate<'teams'>;

export function useTeams() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['teams', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          offices:office_id(name),
          team_members(
            id,
            user_id,
            role,
            active
          )
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    teams: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (team: Omit<TeamInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('teams')
        .insert({ ...team, tenant_id: activeTenant.tenant_id })
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Equipe criada",
        description: "A equipe foi criada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating team:', error);
      toast({
        title: "Erro ao criar equipe",
        description: "Não foi possível criar a equipe. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    createTeam: mutation.mutate,
    createTeamAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ id, ...updates }: TeamUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Equipe atualizada",
        description: "A equipe foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating team:', error);
      toast({
        title: "Erro ao atualizar equipe",
        description: "Não foi possível atualizar a equipe. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    updateTeam: mutation.mutate,
    updateTeamAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('teams')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Equipe desativada",
        description: "A equipe foi desativada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deactivating team:', error);
      toast({
        title: "Erro ao desativar equipe",
        description: "Não foi possível desativar a equipe. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    deleteTeam: mutation.mutate,
    deleteTeamAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
