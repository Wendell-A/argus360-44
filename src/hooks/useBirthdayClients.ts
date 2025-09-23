import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BirthdayClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  days_until_birthday: number;
  message_sent: boolean;
  message_sent_date?: string;
}

export function useBirthdayClients() {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['birthday_clients', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      // Buscar clientes com data de nascimento nos próximos 7 dias
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          phone,
          birth_date
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .not('birth_date', 'is', null)
        .gte('birth_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]) // Para filtrar no SQL
        .order('birth_date', { ascending: true });

      if (error) {
        console.error('Error fetching birthday clients:', error);
        throw error;
      }

      // Filtrar clientes com aniversário na semana atual (próximos 7 dias)
      const today = new Date();
      const weekFromToday = new Date();
      weekFromToday.setDate(today.getDate() + 7);

      const birthdayClients: BirthdayClient[] = [];

      for (const client of clients || []) {
        if (!client.birth_date) continue;

        const birthDate = new Date(client.birth_date);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // Se o aniversário deste ano já passou, considerar o do próximo ano
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysDiff = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Incluir apenas se o aniversário estiver nos próximos 7 dias
        if (daysDiff >= 0 && daysDiff <= 7) {
          // Verificar se já foi enviada mensagem de aniversário hoje
          const { data: interactions } = await supabase
            .from('client_interactions')
            .select('id, created_at')
            .eq('client_id', client.id)
            .eq('tenant_id', activeTenant.tenant_id)
            .eq('interaction_type', 'whatsapp')
            .ilike('title', '%aniversário%')
            .gte('created_at', today.toISOString().split('T')[0])
            .limit(1);

          birthdayClients.push({
            id: client.id,
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            birth_date: client.birth_date,
            days_until_birthday: daysDiff,
            message_sent: (interactions && interactions.length > 0),
            message_sent_date: interactions?.[0]?.created_at
          });
        }
      }

      return birthdayClients.sort((a, b) => a.days_until_birthday - b.days_until_birthday);
    },
    enabled: !!activeTenant?.tenant_id,
  });
}

export function useSendBirthdayMessage() {
  const queryClient = useQueryClient();
  const { activeTenant, user } = useAuth();

  return useMutation({
    mutationFn: async ({ clientId, customMessage }: { clientId: string; customMessage: string }) => {
      if (!activeTenant?.tenant_id || !user?.id) {
        throw new Error('Authentication required');
      }

      // Criar interação para registrar o envio da mensagem
      const { data, error } = await supabase
        .from('client_interactions')
        .insert({
          tenant_id: activeTenant.tenant_id,
          client_id: clientId,
          seller_id: user.id,
          interaction_type: 'whatsapp',
          title: 'Mensagem de Felicitações de Aniversário',
          description: customMessage,
          status: 'completed',
          completed_at: new Date().toISOString(),
          priority: 'medium'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending birthday message:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthday_clients'] });
      queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    },
  });
}