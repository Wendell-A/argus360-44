
-- Corrigir função create_initial_user_setup para criar escritório matriz automaticamente
CREATE OR REPLACE FUNCTION public.create_initial_user_setup(user_id uuid, user_email text, user_full_name text, tenant_name text, tenant_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  
  -- Criar escritório matriz automaticamente
  INSERT INTO public.offices (tenant_id, name, type, responsible_id, active)
  VALUES (new_tenant_id, 'Escritório Matriz', 'matriz', user_id, true)
  RETURNING id INTO new_office_id;
  
  -- Associar o usuário ao escritório matriz
  INSERT INTO public.office_users (user_id, office_id, tenant_id, role, active)
  VALUES (user_id, new_office_id, new_tenant_id, 'owner', true);
  
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
$function$
