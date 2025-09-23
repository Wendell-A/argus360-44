-- Correção Crítica de Segurança: Tabela Profiles (v2) - 23/09/2025
-- Problema: Tabela profiles publicamente acessível com dados sensíveis

-- 1. Remover TODAS as políticas existentes da tabela profiles
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Função auxiliar para verificar se user pode acessar perfil no contexto do tenant
CREATE OR REPLACE FUNCTION public.can_access_profile_in_tenant(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Usuário pode acessar seu próprio perfil
  SELECT CASE 
    WHEN profile_user_id = auth.uid() THEN true
    -- Ou se tem contexto de tenant compartilhado e permissão adequada
    WHEN EXISTS (
      SELECT 1 
      FROM public.tenant_users tu1
      JOIN public.tenant_users tu2 ON tu1.tenant_id = tu2.tenant_id
      WHERE tu1.user_id = auth.uid() 
        AND tu2.user_id = profile_user_id
        AND tu1.active = true 
        AND tu2.active = true
        AND (
          -- Owner/Admin podem ver todos os perfis do tenant
          tu1.role IN ('owner', 'admin')
          OR
          -- Manager pode ver perfis do mesmo escritório
          (tu1.role = 'manager' AND tu1.office_id = tu2.office_id)
          OR
          -- User/Viewer podem ver apenas perfis do mesmo escritório (contexto limitado)
          (tu1.role IN ('user', 'viewer') AND tu1.office_id = tu2.office_id)
        )
    ) THEN true
    ELSE false
  END;
$$;

-- 3. Política RLS restritiva para SELECT - APENAS usuários autenticados
CREATE POLICY "Authenticated users can view profiles within tenant context"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Verificar se o usuário autenticado pode acessar este perfil
  public.can_access_profile_in_tenant(id)
);

-- 4. Política para INSERT - usuários podem criar apenas seu próprio perfil
CREATE POLICY "Authenticated users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
);

-- 5. Política para UPDATE - usuários podem atualizar seu próprio perfil ou admins podem atualizar
CREATE POLICY "Authenticated users can update profiles with proper context"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- Próprio perfil
  id = auth.uid()
  OR
  -- Ou é admin/owner no mesmo tenant
  EXISTS (
    SELECT 1 
    FROM public.tenant_users tu1
    JOIN public.tenant_users tu2 ON tu1.tenant_id = tu2.tenant_id
    WHERE tu1.user_id = auth.uid() 
      AND tu2.user_id = profiles.id
      AND tu1.active = true 
      AND tu2.active = true
      AND tu1.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 
    FROM public.tenant_users tu1
    JOIN public.tenant_users tu2 ON tu1.tenant_id = tu2.tenant_id
    WHERE tu1.user_id = auth.uid() 
      AND tu2.user_id = profiles.id
      AND tu1.active = true 
      AND tu2.active = true
      AND tu1.role IN ('owner', 'admin')
  )
);

-- 6. Política para DELETE - apenas admins podem deletar
CREATE POLICY "Admins can delete profiles within tenant context"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tenant_users tu1
    JOIN public.tenant_users tu2 ON tu1.tenant_id = tu2.tenant_id
    WHERE tu1.user_id = auth.uid() 
      AND tu2.user_id = profiles.id
      AND tu1.active = true 
      AND tu2.active = true
      AND tu1.role IN ('owner', 'admin')
  )
);

-- 7. Função para busca segura de perfis (para uso interno)
CREATE OR REPLACE FUNCTION public.get_user_profile_safe(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record public.profiles%ROWTYPE;
BEGIN
  -- Verificar se pode acessar este perfil
  IF NOT public.can_access_profile_in_tenant(user_uuid) THEN
    RETURN jsonb_build_object('error', 'Acesso negado');
  END IF;
  
  -- Buscar perfil
  SELECT * INTO profile_record
  FROM public.profiles
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Perfil não encontrado');
  END IF;
  
  -- Retornar dados seguros (mascarar telefone para outros usuários)
  RETURN jsonb_build_object(
    'id', profile_record.id,
    'full_name', profile_record.full_name,
    'email', profile_record.email,
    'phone', 
      CASE 
        WHEN profile_record.id = auth.uid() THEN profile_record.phone
        ELSE COALESCE(
          CASE 
            WHEN LENGTH(profile_record.phone) > 4 
            THEN LEFT(profile_record.phone, 3) || '****' || RIGHT(profile_record.phone, 2)
            ELSE '****'
          END, 
          null
        )
      END,
    'avatar_url', profile_record.avatar_url,
    'bio', profile_record.bio,
    'created_at', profile_record.created_at
  );
END;
$$;