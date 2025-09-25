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

      console.log('🔍 Buscando clientes aniversariantes para tenant:', activeTenant.tenant_id);
      console.log('⏰ Data atual:', new Date().toISOString());

      // Buscar clientes com data de nascimento nos últimos 3 dias, hoje, e próximos 7 dias
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
        .order('birth_date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching birthday clients:', error);
        throw error;
      }

      console.log('📊 Total de clientes com data de nascimento encontrados:', clients?.length || 0);
      
      // Listar alguns exemplos para debug
      if (clients && clients.length > 0) {
        console.log('🎯 Exemplo de clientes com birth_date:', 
          clients.slice(0, 3).map(c => ({ 
            name: c.name, 
            birth_date: c.birth_date
          }))
        );
      }

      // Filtrar clientes com aniversário nos últimos 3 dias, hoje, e próximos 7 dias (total: 11 dias)
      const today = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);
      const sevenDaysFromToday = new Date();
      sevenDaysFromToday.setDate(today.getDate() + 7);

      const birthdayClients: BirthdayClient[] = [];

      for (const client of clients || []) {
        if (!client.birth_date) continue;

        // Corrigir problema de fuso horário ao converter birth_date
        // Em vez de usar new Date(client.birth_date), vamos parseear manualmente
        const [year, month, day] = client.birth_date.split('-').map(Number);
        const birthDate = new Date(year, month - 1, day); // mês é 0-indexado
        const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
        
        // Se o aniversário deste ano já passou há mais de 3 dias, considerar o do próximo ano
        if (thisYearBirthday < threeDaysAgo) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysDiff = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Incluir se o aniversário estiver entre -3 e +7 dias
        if (daysDiff >= -3 && daysDiff <= 7) {
          let status = '';
          if (daysDiff < 0) status = `(há ${Math.abs(daysDiff)} dias)`;
          else if (daysDiff === 0) status = '(hoje)';
          else status = `(em ${daysDiff} dias)`;
          
          console.log(`🎂 Cliente ${client.name} fez/fará aniversário ${status} (birth_date: ${client.birth_date}, próximo aniversário: ${thisYearBirthday.getFullYear()}-${String(thisYearBirthday.getMonth() + 1).padStart(2, '0')}-${String(thisYearBirthday.getDate()).padStart(2, '0')})`);

          console.log(`🔍 DEBUG Datas para ${client.name}:`, {
            original_birth_date: client.birth_date,
            parsed_year: year,
            parsed_month: month,
            parsed_day: day,
            birthDate_day: birthDate.getDate(),
            thisYearBirthday_day: thisYearBirthday.getDate(),
            daysDiff: daysDiff
          });
          
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

      console.log('🎉 Total de aniversariantes (últimos 3 dias + próximos 7 dias):', birthdayClients.length);
      return birthdayClients.sort((a, b) => a.days_until_birthday - b.days_until_birthday);
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 30 * 1000, // 30 segundos - dados ficam fresh por apenas 30 seg
    gcTime: 2 * 60 * 1000, // 2 minutos - dados ficam em cache por 2 min
    refetchOnWindowFocus: true, // Atualiza quando a aba ganha foco
    refetchInterval: 2 * 60 * 1000, // Atualiza automaticamente a cada 2 minutos
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