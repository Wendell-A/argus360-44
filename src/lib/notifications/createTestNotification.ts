import { supabase } from '@/integrations/supabase/client';

export interface CreateTestNotificationParams {
  userId: string;
  tenantId: string;
  type: 'NEW_SALE_FOR_APPROVAL' | 'SALE_APPROVED' | 'CLIENT_TRANSFERRED_TO_YOU' | 'GOAL_ACHIEVED';
  data?: Record<string, any>;
  ctaLink?: string;
}

/**
 * Função auxiliar para criar notificações de teste
 * 
 * Útil para testar o sistema de notificações sem precisar executar ações reais
 * 
 * @example
 * ```typescript
 * await createTestNotification({
 *   userId: 'user-uuid',
 *   tenantId: 'tenant-uuid',
 *   type: 'NEW_SALE_FOR_APPROVAL',
 *   data: {
 *     client_name: 'João Silva',
 *     seller_name: 'Maria Santos',
 *     sale_value: 50000,
 *     sale_date: new Date().toISOString(),
 *   },
 *   ctaLink: '/vendas/abc-123',
 * });
 * ```
 */
export async function createTestNotification({
  userId,
  tenantId,
  type,
  data = {},
  ctaLink,
}: CreateTestNotificationParams) {
  const defaultData: Record<string, any> = {
    NEW_SALE_FOR_APPROVAL: {
      client_name: 'Cliente Teste',
      seller_name: 'Vendedor Teste',
      sale_value: 50000,
      sale_date: new Date().toISOString(),
    },
    SALE_APPROVED: {
      client_name: 'Cliente Teste',
      sale_value: 50000,
      approval_date: new Date().toISOString(),
    },
    CLIENT_TRANSFERRED_TO_YOU: {
      client_name: 'Cliente Teste',
      from_user_name: 'Usuário Teste',
      transfer_date: new Date().toISOString(),
    },
    GOAL_ACHIEVED: {
      goal_name: 'Meta Mensal',
      goal_value: 100000,
      achieved_value: 105000,
      achievement_date: new Date().toISOString(),
    },
  };

  const notificationData = {
    ...defaultData[type],
    ...data,
  };

  const defaultCtaLinks: Record<string, string> = {
    NEW_SALE_FOR_APPROVAL: '/vendas',
    SALE_APPROVED: '/vendas',
    CLIENT_TRANSFERRED_TO_YOU: '/clientes',
    GOAL_ACHIEVED: '/metas',
  };

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      type,
      data: notificationData,
      cta_link: ctaLink || defaultCtaLinks[type],
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar notificação de teste:', error);
    throw error;
  }

  console.log('Notificação de teste criada:', notification);
  return notification;
}
