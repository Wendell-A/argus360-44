-- Migração: Refatoração do Sistema de Permissões para CRUD Granular
-- Data: 2025-09-30
-- Objetivo: Implementar controle granular de permissões CRUD

-- =====================================================
-- PARTE 1: PADRONIZAÇÃO DAS AÇÕES NA TABELA permissions
-- =====================================================

-- Atualizar ações em português para inglês padronizado
UPDATE public.permissions
SET actions = ARRAY(
  SELECT DISTINCT 
    CASE 
      WHEN action = 'criar' THEN 'create'
      WHEN action = 'ler' THEN 'read'
      WHEN action = 'editar' THEN 'update'
      WHEN action = 'excluir' THEN 'delete'
      WHEN action = 'gerenciar' THEN 'manage'
      WHEN action = 'write' THEN 'create'
      ELSE action
    END
  FROM unnest(actions) AS action
)
WHERE EXISTS (
  SELECT 1 FROM unnest(actions) AS action 
  WHERE action IN ('criar', 'ler', 'editar', 'excluir', 'gerenciar', 'write')
);

-- =====================================================
-- PARTE 2: ADICIONAR COLUNA PARA PERMISSÕES GRANULARES
-- =====================================================

-- Adicionar coluna granular_permissions se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_users' 
    AND column_name = 'granular_permissions'
  ) THEN
    ALTER TABLE public.tenant_users 
    ADD COLUMN granular_permissions JSONB DEFAULT '{}'::JSONB;
    
    CREATE INDEX idx_tenant_users_granular_permissions_gin 
    ON public.tenant_users USING GIN (granular_permissions);
  END IF;
END $$;

-- =====================================================
-- PARTE 3: FUNÇÃO PARA MIGRAR PERMISSÕES EXISTENTES
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_role_permissions_to_granular()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  permission_record RECORD;
  granular_perms JSONB := '{}'::JSONB;
  module_key TEXT;
  module_permissions JSONB;
BEGIN
  -- Para cada usuário ativo
  FOR user_record IN 
    SELECT user_id, tenant_id, role 
    FROM public.tenant_users 
    WHERE active = true 
    AND (granular_permissions IS NULL OR granular_permissions = '{}'::JSONB)
  LOOP
    granular_perms := '{}'::JSONB;
    
    -- Obter todas as permissões da role do usuário
    FOR permission_record IN
      SELECT p.module, p.resource, p.actions
      FROM public.role_permissions rp
      JOIN public.permissions p ON p.id = rp.permission_id
      WHERE rp.role = user_record.role
        AND rp.tenant_id = user_record.tenant_id
    LOOP
      -- Criar chave: module:resource
      module_key := permission_record.module || ':' || permission_record.resource;
      
      -- Criar objeto CRUD
      module_permissions := jsonb_build_object(
        'create', 'create' = ANY(permission_record.actions) OR 'criar' = ANY(permission_record.actions),
        'read', 'read' = ANY(permission_record.actions) OR 'ler' = ANY(permission_record.actions),
        'update', 'update' = ANY(permission_record.actions) OR 'editar' = ANY(permission_record.actions),
        'delete', 'delete' = ANY(permission_record.actions) OR 'excluir' = ANY(permission_record.actions),
        'manage', 'manage' = ANY(permission_record.actions) OR 'gerenciar' = ANY(permission_record.actions)
      );
      
      granular_perms := granular_perms || jsonb_build_object(module_key, module_permissions);
    END LOOP;
    
    -- Atualizar usuário com permissões granulares
    UPDATE public.tenant_users
    SET granular_permissions = granular_perms
    WHERE user_id = user_record.user_id 
      AND tenant_id = user_record.tenant_id;
      
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully';
END;
$$;

-- Executar migração
SELECT migrate_role_permissions_to_granular();

-- =====================================================
-- PARTE 4: FUNÇÃO PARA VERIFICAR PERMISSÃO GRANULAR
-- =====================================================

CREATE OR REPLACE FUNCTION has_granular_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_module TEXT,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role;
  granular_perms JSONB;
  module_key TEXT;
  has_perm BOOLEAN := FALSE;
BEGIN
  -- Construir chave do módulo
  module_key := p_module || ':' || p_resource;
  
  -- Obter role do usuário
  SELECT role INTO user_role
  FROM public.tenant_users
  WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id 
    AND active = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Owner e Admin têm acesso total
  IF user_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Buscar permissões granulares
  SELECT granular_permissions INTO granular_perms
  FROM public.tenant_users
  WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id;
  
  -- Verificar permissão específica
  IF granular_perms IS NOT NULL AND granular_perms ? module_key THEN
    has_perm := COALESCE(
      (granular_perms->module_key->>p_action)::BOOLEAN,
      FALSE
    );
    
    -- Se tem 'manage', tem todas as permissões
    IF NOT has_perm AND granular_perms->module_key->>'manage' = 'true' THEN
      RETURN TRUE;
    END IF;
    
    RETURN has_perm;
  END IF;
  
  -- Fallback: verificar permissões antigas
  SELECT 
    p_action = ANY(p.actions) INTO has_perm
  FROM public.role_permissions rp
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE rp.role = user_role
    AND rp.tenant_id = p_tenant_id
    AND p.module = p_module
    AND p.resource = p_resource;
  
  RETURN COALESCE(has_perm, FALSE);
END;
$$;

-- =====================================================
-- PARTE 5: TRIGGER PARA ATUALIZAR AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION auto_update_granular_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando um usuário é adicionado ou sua role muda, atualizar permissões granulares
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role != NEW.role) THEN
    PERFORM migrate_role_permissions_to_granular();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_update_granular_permissions ON public.tenant_users;

CREATE TRIGGER trigger_auto_update_granular_permissions
AFTER INSERT OR UPDATE OF role ON public.tenant_users
FOR EACH ROW
EXECUTE FUNCTION auto_update_granular_permissions();

-- =====================================================
-- PARTE 6: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN public.tenant_users.granular_permissions IS 
'Permissões granulares CRUD em formato JSON: {"module:resource": {"create": bool, "read": bool, "update": bool, "delete": bool, "manage": bool}}';

COMMENT ON FUNCTION migrate_role_permissions_to_granular() IS 
'Migra permissões baseadas em role_permissions para formato granular CRUD em tenant_users.granular_permissions';

COMMENT ON FUNCTION has_granular_permission(UUID, UUID, TEXT, TEXT, TEXT) IS 
'Verifica se usuário tem permissão granular específica. Owner e Admin sempre retornam true. Suporta ação "manage" que garante todas as permissões.';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  total_users INTEGER;
  users_with_granular INTEGER;
  total_permissions INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users 
  FROM public.tenant_users WHERE active = true;
  
  SELECT COUNT(*) INTO users_with_granular 
  FROM public.tenant_users 
  WHERE active = true 
    AND granular_permissions IS NOT NULL 
    AND granular_permissions != '{}'::JSONB;
  
  SELECT COUNT(*) INTO total_permissions
  FROM public.permissions;
  
  RAISE NOTICE 'Total de usuários ativos: %', total_users;
  RAISE NOTICE 'Usuários com permissões granulares: %', users_with_granular;
  RAISE NOTICE 'Total de permissões disponíveis: %', total_permissions;
END $$;