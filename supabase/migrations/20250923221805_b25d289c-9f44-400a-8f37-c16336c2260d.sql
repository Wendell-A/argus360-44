-- Correção Crítica das RLS - 23/09/2025
-- Permitir acesso básico aos próprios perfis para funcionamento da aplicação

-- 1. Corrigir política RLS na tabela profiles
-- Remover política muito restritiva e criar uma que permite acesso ao próprio perfil
DROP POLICY IF EXISTS "Users can view profiles based on tenant context" ON public.profiles;

-- Nova política: usuários sempre podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política para ver perfis de outros usuários no contexto do tenant (mantendo segurança)
CREATE POLICY "Users can view other profiles in tenant context"
ON public.profiles  
FOR SELECT
TO authenticated
USING (
  id != auth.uid() 
  AND public.can_access_profile_in_tenant(id)
);

-- 2. Melhorar função get_user_tenant_ids para ser mais robusta
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    tenant_ids uuid[];
BEGIN
    -- Se não há usuário autenticado, retorna array vazio
    IF user_uuid IS NULL THEN
        RETURN ARRAY[]::uuid[];
    END IF;
    
    SELECT ARRAY(
        SELECT DISTINCT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = user_uuid 
        AND active = true
    ) INTO tenant_ids;
    
    RETURN COALESCE(tenant_ids, ARRAY[]::uuid[]);
END;
$$;

-- 3. Melhorar função get_authenticated_user_data para funcionar sem dependências de tenant
CREATE OR REPLACE FUNCTION public.get_authenticated_user_data()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_data jsonb;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;
  
  -- Buscar dados básicos do perfil (sempre acessível para o próprio usuário)
  SELECT jsonb_build_object(
    'authenticated', true,
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'phone', p.phone,
    'bio', p.bio,
    'created_at', p.created_at
  ) INTO user_data
  FROM public.profiles p
  WHERE p.id = current_user_id;
  
  -- Se não encontrou perfil, retornar dados mínimos
  IF user_data IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', true, 
      'id', current_user_id,
      'needs_profile', true
    );
  END IF;
  
  RETURN user_data;
END;
$$;

-- 4. Corrigir política RLS na tabela tenant_users para permitir inserção básica
DROP POLICY IF EXISTS "Users can create tenant users for any tenant" ON public.tenant_users;

CREATE POLICY "Users can create their own tenant association" 
ON public.tenant_users 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 5. Garantir que perfis possam ser criados pelos próprios usuários
DROP POLICY IF EXISTS "Users can manage their profiles" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());