-- ETAPA 2: POLÍTICAS RLS CONTEXTUAIS PARA RBAC
-- Data: 26/01/2025
-- Objetivo: Implementar Row Level Security baseado em hierarquia e contexto

-- ================================================
-- 1. POLÍTICAS CONTEXTUAIS PARA CLIENTS
-- ================================================

-- Remover políticas existentes de clients
DROP POLICY IF EXISTS "Users can manage clients in their tenants" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients in their tenants" ON public.clients;

-- Política contextual para visualização de clientes
CREATE POLICY "Users can view clients based on context" 
ON public.clients 
FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin podem ver todos os clientes do tenant
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode ver clientes dos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    -- User/Viewer podem ver apenas clientes do próprio escritório ou sob responsabilidade
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
      AND (
        office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
        OR responsible_user_id = auth.uid()
      )
    )
  )
);

-- Política contextual para gerenciar clientes
CREATE POLICY "Users can manage clients based on context" 
ON public.clients 
FOR ALL 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin podem gerenciar todos os clientes
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode gerenciar clientes dos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    -- User pode gerenciar apenas clientes sob sua responsabilidade
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'user'
      AND responsible_user_id = auth.uid()
    )
  )
);

-- ================================================
-- 2. POLÍTICAS CONTEXTUAIS PARA SALES
-- ================================================

-- Remover políticas existentes de sales
DROP POLICY IF EXISTS "Users can manage sales in their tenants" ON public.sales;
DROP POLICY IF EXISTS "Users can view sales in their tenants" ON public.sales;

-- Política contextual para visualização de vendas
CREATE POLICY "Users can view sales based on context" 
ON public.sales 
FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin podem ver todas as vendas
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode ver vendas dos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    -- User/Viewer podem ver apenas suas próprias vendas
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
      AND seller_id = auth.uid()
    )
  )
);

-- Política contextual para gerenciar vendas
CREATE POLICY "Users can manage sales based on context" 
ON public.sales 
FOR ALL 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin podem gerenciar todas as vendas
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode gerenciar vendas dos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    -- User pode gerenciar apenas suas próprias vendas
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'user'
      AND seller_id = auth.uid()
    )
  )
);

-- ================================================
-- 3. POLÍTICAS CONTEXTUAIS PARA COMMISSIONS
-- ================================================

-- Remover políticas existentes de commissions
DROP POLICY IF EXISTS "Admins can manage commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can view commissions in their tenants" ON public.commissions;

-- Política contextual para visualização de comissões
CREATE POLICY "Users can view commissions based on context" 
ON public.commissions 
FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin podem ver todas as comissões
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode ver comissões relacionadas aos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND (
        -- Comissões de escritório que o manager pode acessar
        (recipient_type = 'office' AND recipient_id = ANY (get_user_context_offices(auth.uid(), tenant_id)))
        OR
        -- Comissões de vendedores dos escritórios acessíveis
        (recipient_type = 'seller' AND EXISTS (
          SELECT 1 FROM public.tenant_users tu 
          WHERE tu.user_id = recipient_id 
          AND tu.tenant_id = commissions.tenant_id
          AND tu.office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
        ))
      )
    )
    OR
    -- User/Viewer podem ver apenas suas próprias comissões
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
      AND recipient_type = 'seller'
      AND recipient_id = auth.uid()
    )
  )
);

-- Política contextual para gerenciar comissões
CREATE POLICY "Users can manage commissions based on context" 
ON public.commissions 
FOR ALL 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
);

-- ================================================
-- 4. POLÍTICAS CONTEXTUAIS PARA GOALS
-- ================================================

-- Remover políticas existentes de goals
DROP POLICY IF EXISTS "Managers can manage goals in their tenants" ON public.goals;
DROP POLICY IF EXISTS "Users can view goals in their tenants" ON public.goals;

-- Política contextual para visualização de metas
CREATE POLICY "Users can view goals based on context" 
ON public.goals 
FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin podem ver todas as metas
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode ver metas dos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND (
        goal_type = 'office' AND office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
        OR goal_type = 'individual' AND user_id = auth.uid()
      )
    )
    OR
    -- User/Viewer podem ver apenas suas próprias metas
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
      AND goal_type = 'individual' 
      AND user_id = auth.uid()
    )
  )
);

-- Política contextual para gerenciar metas
CREATE POLICY "Users can manage goals based on context" 
ON public.goals 
FOR ALL 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin podem gerenciar todas as metas
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode gerenciar metas dos contextos acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND (
        goal_type = 'office' AND office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
        OR goal_type = 'individual' AND user_id = auth.uid()
      )
    )
  )
);

-- ================================================
-- 5. POLÍTICAS CONTEXTUAIS PARA TENANT_USERS
-- ================================================

-- Atualizar política existente de tenant_users para ser mais contextual
DROP POLICY IF EXISTS "Users can view tenant users in their tenants" ON public.tenant_users;

-- Nova política contextual para visualização de usuários do tenant
CREATE POLICY "Users can view tenant users based on context" 
ON public.tenant_users 
FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Sempre pode ver próprio registro
    user_id = auth.uid()
    OR
    -- Owner/Admin podem ver todos os usuários
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode ver usuários dos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
    )
  )
);

-- ================================================
-- 6. FUNÇÃO AUXILIAR PARA MIDDLEWARE DE AUTORIZAÇÃO
-- ================================================

-- Função para verificar se usuário pode executar ação específica
CREATE OR REPLACE FUNCTION public.can_user_perform_action(
  user_uuid uuid,
  tenant_uuid uuid,
  action_type text,
  resource_type text,
  resource_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role_val user_role;
  user_offices uuid[];
  can_perform boolean := false;
BEGIN
  -- Obter role e contexto do usuário
  SELECT get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT get_user_context_offices(user_uuid, tenant_uuid) INTO user_offices;
  
  -- Owner e Admin podem fazer tudo
  IF user_role_val IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Verificações específicas por tipo de recurso
  CASE resource_type
    WHEN 'client' THEN
      IF action_type IN ('read', 'create', 'update', 'delete') THEN
        -- Manager pode gerenciar clientes dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          -- Se resource_id fornecido, verificar se cliente está em escritório acessível
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.clients 
              WHERE id = resource_id 
              AND office_id = ANY(user_offices)
            ) INTO can_perform;
          ELSE
            can_perform := true; -- Pode criar/listar dentro do contexto
          END IF;
        -- User pode gerenciar apenas clientes sob responsabilidade
        ELSIF user_role_val = 'user' AND action_type != 'delete' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.clients 
              WHERE id = resource_id 
              AND responsible_user_id = user_uuid
            ) INTO can_perform;
          ELSE
            can_perform := true; -- Pode criar/listar próprios clientes
          END IF;
        END IF;
      END IF;
      
    WHEN 'sale' THEN
      IF action_type IN ('read', 'create', 'update') THEN
        -- Manager pode gerenciar vendas dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.sales 
              WHERE id = resource_id 
              AND office_id = ANY(user_offices)
            ) INTO can_perform;
          ELSE
            can_perform := true;
          END IF;
        -- User pode gerenciar apenas próprias vendas
        ELSIF user_role_val = 'user' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.sales 
              WHERE id = resource_id 
              AND seller_id = user_uuid
            ) INTO can_perform;
          ELSE
            can_perform := true;
          END IF;
        END IF;
      END IF;
      
    WHEN 'commission' THEN
      IF action_type = 'read' THEN
        -- Manager pode ver comissões dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          can_perform := true; -- RLS já filtra
        -- User pode ver apenas próprias comissões
        ELSIF user_role_val = 'user' THEN
          can_perform := true; -- RLS já filtra
        END IF;
      -- Apenas Manager+ podem gerenciar comissões
      ELSIF action_type IN ('create', 'update', 'delete') AND user_role_val = 'manager' THEN
        can_perform := true;
      END IF;
      
    ELSE
      -- Para outros recursos, usar lógica padrão de role
      can_perform := user_role_val IN ('manager', 'user') AND action_type IN ('read', 'create', 'update');
  END CASE;
  
  RETURN can_perform;
END;
$$;

-- ================================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================

COMMENT ON FUNCTION public.can_user_perform_action IS 
'Função middleware para verificar se usuário pode executar ação específica em recurso baseado em seu contexto hierárquico';

COMMENT ON POLICY "Users can view clients based on context" ON public.clients IS
'Política RLS contextual: Owner/Admin veem todos, Manager vê de escritórios acessíveis, User vê apenas sob responsabilidade';

COMMENT ON POLICY "Users can view sales based on context" ON public.sales IS
'Política RLS contextual: Owner/Admin veem todas, Manager vê de escritórios acessíveis, User vê apenas próprias vendas';

COMMENT ON POLICY "Users can view commissions based on context" ON public.commissions IS
'Política RLS contextual: Owner/Admin veem todas, Manager vê de contexto acessível, User vê apenas próprias';

COMMENT ON POLICY "Users can view goals based on context" ON public.goals IS
'Política RLS contextual: Owner/Admin veem todas, Manager vê de escritórios acessíveis, User vê apenas próprias';