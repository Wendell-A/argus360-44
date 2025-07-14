
-- Função para criar usuário inicial com tenant (bypass RLS temporário)
CREATE OR REPLACE FUNCTION public.create_initial_user_setup(
  user_id uuid,
  user_email text,
  user_full_name text,
  tenant_name text,
  tenant_slug text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id uuid;
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
  
  -- Retornar informações do setup
  result := jsonb_build_object(
    'tenant_id', new_tenant_id,
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

-- Função para adicionar usuário a tenant existente
CREATE OR REPLACE FUNCTION public.add_user_to_tenant(
  user_id uuid,
  user_email text,
  user_full_name text,
  target_tenant_id uuid,
  user_role user_role DEFAULT 'user'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Verificar se tenant existe e está ativo
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants 
    WHERE id = target_tenant_id 
    AND status IN ('trial', 'active')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tenant não encontrado ou inativo'
    );
  END IF;
  
  -- Criar perfil do usuário
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (user_id, user_email, user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
    
  -- Criar associação tenant_user
  INSERT INTO public.tenant_users (user_id, tenant_id, role, active, joined_at)
  VALUES (user_id, target_tenant_id, user_role, true, now());
  
  result := jsonb_build_object(
    'tenant_id', target_tenant_id,
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

-- Função para obter dados completos do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_authenticated_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_id uuid;
  user_data jsonb;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;
  
  SELECT jsonb_build_object(
    'authenticated', true,
    'user_id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'tenants', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'tenant_id', t.id,
          'tenant_name', t.name,
          'tenant_slug', t.slug,
          'tenant_status', t.status,
          'user_role', tu.role,
          'active', tu.active
        )
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'::jsonb
    )
  )
  INTO user_data
  FROM public.profiles p
  LEFT JOIN public.tenant_users tu ON tu.user_id = p.id AND tu.active = true
  LEFT JOIN public.tenants t ON t.id = tu.tenant_id
  WHERE p.id = current_user_id
  GROUP BY p.id, p.email, p.full_name, p.avatar_url;
  
  RETURN COALESCE(user_data, jsonb_build_object('authenticated', false));
END;
$$;

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só cria perfil básico, o tenant será criado via função específica
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, '')
  );
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
