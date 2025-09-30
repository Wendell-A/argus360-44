import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: string;
  data: any; // Using any for flexibility with Supabase Json type
  cta_link: string | null;
  is_read: boolean;
  created_at: string;
}

const POLLING_INTERVAL = 90000; // 90 segundos

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Função para buscar contagem de notificações não lidas via RPC
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        setUnreadCount(0);
        return;
      }

      // Chamar a função RPC que usa cache Redis
      const { data, error } = await supabase.rpc('get_unread_notification_count');

      if (error) {
        console.error('Erro ao buscar contagem de notificações:', error);
        return;
      }

      const count = data || 0;
      
      // Só atualizar se mudou (evitar re-renders desnecessários)
      setUnreadCount((prev) => {
        if (prev !== count && count > prev) {
          // Nova notificação chegou
          toast({
            title: 'Nova notificação',
            description: `Você tem ${count} notificação${count > 1 ? 'ões' : ''} não lida${count > 1 ? 's' : ''}`,
          });
        }
        return count;
      });
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  }, [toast]);

  // Função para buscar lista completa de notificações (sob demanda)
  const fetchNotificationsList = useCallback(async () => {
    setIsFetchingList(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao buscar lista de notificações:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as notificações',
          variant: 'destructive',
        });
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setIsFetchingList(false);
    }
  }, [toast]);

  // Função para marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return;
      }

      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      // Atualizar contagem
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Invalidar cache Redis para este usuário
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        try {
          await supabase.functions.invoke('redis-cache', {
            body: {
              action: 'invalidate',
              userId: session.session.user.id,
            },
          });
        } catch (cacheError) {
          console.warn('Erro ao invalidar cache:', cacheError);
        }
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Função para marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.session.user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        return;
      }

      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      // Invalidar cache
      try {
        await supabase.functions.invoke('redis-cache', {
          body: {
            action: 'invalidate',
            userId: session.session.user.id,
          },
        });
      } catch (cacheError) {
        console.warn('Erro ao invalidar cache:', cacheError);
      }

      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas',
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, [toast]);

  // Iniciar polling ao montar o componente
  useEffect(() => {
    setIsLoading(true);
    
    // Buscar contagem inicial
    fetchUnreadCount().finally(() => setIsLoading(false));

    // Configurar polling a cada 90 segundos
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLLING_INTERVAL);

    // Cleanup: limpar interval ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    notifications,
    isLoading,
    isFetchingList,
    fetchNotificationsList,
    markAsRead,
    markAllAsRead,
    refresh: fetchUnreadCount,
  };
}
