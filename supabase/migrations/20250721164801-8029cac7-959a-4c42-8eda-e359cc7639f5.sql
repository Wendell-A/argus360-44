
-- FASE 1: Correção da Função de Setup Inicial
-- Atualizar função create_initial_user_setup para criar escritório matriz automaticamente
CREATE OR REPLACE FUNCTION public.create_initial_user_setup(
  user_id uuid, 
  user_email text, 
  user_full_name text, 
  tenant_name text, 
  tenant_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id uuid;
  new_office_id uuid;
  result jsonb;
BEGIN
  -- Criar tenant
  INSERT INTO public.tenants (name, slug, status)
  VALUES (tenant_name, tenant_slug, 'trial')
  RETURNING id INTO new_tenant_id;
  
  -- Criar perfil do usuário
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (user_id, user_email, user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
    
  -- Criar associação tenant_user como owner
  INSERT INTO public.tenant_users (user_id, tenant_id, role, active, joined_at)
  VALUES (user_id, new_tenant_id, 'owner', true, now());
  
  -- NOVO: Criar escritório matriz automaticamente
  INSERT INTO public.offices (
    tenant_id, 
    name, 
    type, 
    responsible_id,
    active
  )
  VALUES (
    new_tenant_id, 
    'Escritório Matriz', 
    'matriz',
    user_id,
    true
  )
  RETURNING id INTO new_office_id;
  
  -- NOVO: Associar usuário ao escritório matriz
  INSERT INTO public.office_users (
    user_id, 
    office_id, 
    tenant_id,
    role,
    active
  )
  VALUES (
    user_id, 
    new_office_id, 
    new_tenant_id,
    'owner',
    true
  );
  
  -- Retornar informações do setup
  result := jsonb_build_object(
    'tenant_id', new_tenant_id,
    'office_id', new_office_id,
    'user_id', user_id,
    'success', true
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- FASE 2: Implementação de Auditoria Universal
-- Criar função universal de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_id_value uuid;
BEGIN
  -- Tentar extrair tenant_id do registro
  IF TG_OP = 'DELETE' THEN
    tenant_id_value := OLD.tenant_id;
  ELSE
    tenant_id_value := COALESCE(NEW.tenant_id, OLD.tenant_id);
  END IF;

  INSERT INTO public.audit_log (
    tenant_id,
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    tenant_id_value,
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar auditoria em tabelas críticas
CREATE TRIGGER audit_sales
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_commissions
  AFTER INSERT OR UPDATE OR DELETE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_offices
  AFTER INSERT OR UPDATE OR DELETE ON public.offices
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- FASE 3: Sistema de Metas - Estrutura de Banco de Dados
-- Criar tabela de metas
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_type varchar NOT NULL CHECK (goal_type IN ('office', 'individual')),
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status varchar DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  description text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_goals_tenant_id ON public.goals(tenant_id);
CREATE INDEX idx_goals_office_id ON public.goals(office_id);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_period ON public.goals(period_start, period_end);

-- RLS para isolamento de dados
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view goals in their tenants"
  ON public.goals FOR SELECT
  USING (tenant_id = ANY (get_user_tenant_ids(auth.uid())));

CREATE POLICY "Managers can manage goals in their tenants"
  ON public.goals FOR ALL
  USING (
    tenant_id = ANY (get_user_tenant_ids(auth.uid())) AND
    get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role])
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para auditoria
CREATE TRIGGER audit_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Função para atualizar progresso das metas automaticamente
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar metas individuais do vendedor
  UPDATE public.goals 
  SET current_amount = (
    SELECT COALESCE(SUM(sale_value), 0)
    FROM public.sales 
    WHERE seller_id = NEW.seller_id 
    AND tenant_id = NEW.tenant_id
    AND status = 'approved'
    AND sale_date BETWEEN goals.period_start AND goals.period_end
  )
  WHERE user_id = NEW.seller_id 
  AND tenant_id = NEW.tenant_id
  AND goal_type = 'individual'
  AND status = 'active';
  
  -- Atualizar metas do escritório
  UPDATE public.goals 
  SET current_amount = (
    SELECT COALESCE(SUM(sale_value), 0)
    FROM public.sales 
    WHERE office_id = NEW.office_id 
    AND tenant_id = NEW.tenant_id
    AND status = 'approved'
    AND sale_date BETWEEN goals.period_start AND goals.period_end
  )
  WHERE office_id = NEW.office_id 
  AND tenant_id = NEW.tenant_id
  AND goal_type = 'office'
  AND status = 'active';
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger para atualizar progresso quando vendas forem aprovadas
CREATE TRIGGER update_goal_progress_on_sale
  AFTER INSERT OR UPDATE ON public.sales
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.update_goal_progress();
