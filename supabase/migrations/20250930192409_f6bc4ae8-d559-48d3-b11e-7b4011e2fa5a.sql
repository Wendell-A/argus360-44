-- ============================================================================
-- PARTE 1: CRIAR TABELA NOTIFICATIONS COM RLS
-- ============================================================================

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  cta_link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índices para otimização
  CONSTRAINT notifications_type_check CHECK (type <> '')
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas suas próprias notificações
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas suas próprias notificações
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Sistema pode inserir notificações (via triggers)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- PARTE 2: CRIAR FUNÇÃO RPC get_unread_notification_count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  -- Obter user_id do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Contar notificações não lidas
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.notifications
  WHERE user_id = v_user_id
    AND is_read = false;
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================================================
-- PARTE 3: CRIAR TRIGGER PARA INVALIDAÇÃO DE CACHE
-- ============================================================================

-- Função que será chamada pelo trigger para invalidar cache
CREATE OR REPLACE FUNCTION public.invalidate_notification_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log para debug
  RAISE LOG 'Invalidating notification cache for user_id: %', NEW.user_id;
  
  -- A invalidação real do Redis será feita pela Edge Function
  -- Este trigger serve como ponto de extensão para futuras integrações
  
  RETURN NEW;
END;
$$;

-- Criar trigger AFTER INSERT na tabela notifications
DROP TRIGGER IF EXISTS trigger_invalidate_notification_cache ON public.notifications;
CREATE TRIGGER trigger_invalidate_notification_cache
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_notification_cache();

-- ============================================================================
-- PARTE 4: CRIAR FUNÇÕES DE NOTIFICAÇÃO PARA EVENTOS
-- ============================================================================

-- Função auxiliar para criar notificação
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_tenant_id UUID,
  p_type TEXT,
  p_data JSONB,
  p_cta_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, tenant_id, type, data, cta_link)
  VALUES (p_user_id, p_tenant_id, p_type, p_data, p_cta_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Função de notificação para novas vendas pendentes de aprovação
CREATE OR REPLACE FUNCTION public.notify_new_sale_for_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user RECORD;
  v_client_name TEXT;
  v_seller_name TEXT;
BEGIN
  -- Buscar nome do cliente
  SELECT name INTO v_client_name
  FROM public.clients
  WHERE id = NEW.client_id;
  
  -- Buscar nome do vendedor
  SELECT full_name INTO v_seller_name
  FROM public.profiles
  WHERE id = NEW.seller_id;
  
  -- Notificar todos os admins e owners do tenant
  FOR v_admin_user IN
    SELECT DISTINCT tu.user_id
    FROM public.tenant_users tu
    WHERE tu.tenant_id = NEW.tenant_id
      AND tu.role IN ('owner', 'admin')
      AND tu.active = true
  LOOP
    PERFORM public.create_notification(
      v_admin_user.user_id,
      NEW.tenant_id,
      'NEW_SALE_FOR_APPROVAL',
      jsonb_build_object(
        'sale_id', NEW.id,
        'client_name', v_client_name,
        'seller_name', v_seller_name,
        'sale_value', NEW.sale_value,
        'sale_date', NEW.sale_date
      ),
      '/vendas/' || NEW.id::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar sobre novas vendas
DROP TRIGGER IF EXISTS trigger_notify_new_sale ON public.sales;
CREATE TRIGGER trigger_notify_new_sale
  AFTER INSERT ON public.sales
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_new_sale_for_approval();

-- Função de notificação para vendas aprovadas (notificar vendedor)
CREATE OR REPLACE FUNCTION public.notify_sale_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  -- Só notificar se status mudou para approved
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN
    -- Buscar nome do cliente
    SELECT name INTO v_client_name
    FROM public.clients
    WHERE id = NEW.client_id;
    
    -- Notificar o vendedor
    PERFORM public.create_notification(
      NEW.seller_id,
      NEW.tenant_id,
      'SALE_APPROVED',
      jsonb_build_object(
        'sale_id', NEW.id,
        'client_name', v_client_name,
        'sale_value', NEW.sale_value,
        'approval_date', NEW.approval_date
      ),
      '/vendas/' || NEW.id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar sobre vendas aprovadas
DROP TRIGGER IF EXISTS trigger_notify_sale_approved ON public.sales;
CREATE TRIGGER trigger_notify_sale_approved
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_sale_approved();

-- Função de notificação para transferência de clientes
CREATE OR REPLACE FUNCTION public.notify_client_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
  v_from_user_name TEXT;
BEGIN
  -- Buscar nome do cliente
  SELECT name INTO v_client_name
  FROM public.clients
  WHERE id = NEW.client_id;
  
  -- Buscar nome do usuário que transferiu
  SELECT full_name INTO v_from_user_name
  FROM public.profiles
  WHERE id = NEW.from_user_id;
  
  -- Notificar o usuário que recebeu o cliente
  PERFORM public.create_notification(
    NEW.to_user_id,
    NEW.tenant_id,
    'CLIENT_TRANSFERRED_TO_YOU',
    jsonb_build_object(
      'transfer_id', NEW.id,
      'client_id', NEW.client_id,
      'client_name', v_client_name,
      'from_user_name', v_from_user_name,
      'reason', NEW.reason,
      'transfer_date', NEW.created_at
    ),
    '/clientes/' || NEW.client_id::text
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar sobre transferências de clientes
DROP TRIGGER IF EXISTS trigger_notify_client_transfer ON public.client_transfers;
CREATE TRIGGER trigger_notify_client_transfer
  AFTER INSERT ON public.client_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_transfer();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Permitir execução da função RPC para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;