
-- Primeiro, vamos verificar se existe a função accept_public_invitation e criar/corrigir se necessário
CREATE OR REPLACE FUNCTION public.accept_public_invitation(
  p_token character varying,
  p_user_id uuid,
  p_email character varying,
  p_full_name character varying
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  result jsonb;
BEGIN
  -- Buscar link válido e ativo
  SELECT * INTO link_record
  FROM public.public_invitation_links
  WHERE token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Link de convite inválido ou expirado'
    );
  END IF;

  -- Incrementar uso do link
  UPDATE public.public_invitation_links
  SET current_uses = current_uses + 1
  WHERE id = link_record.id;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, p_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Criar associação tenant_user com dados do link
  INSERT INTO public.tenant_users (
    user_id,
    tenant_id,
    role,
    office_id,
    department_id,
    team_id,
    active,
    joined_at
  ) VALUES (
    p_user_id,
    link_record.tenant_id,
    link_record.role,
    link_record.office_id,
    link_record.department_id,
    link_record.team_id,
    true,
    now()
  ) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    role = EXCLUDED.role,
    office_id = EXCLUDED.office_id,
    department_id = EXCLUDED.department_id,
    team_id = EXCLUDED.team_id,
    active = true,
    joined_at = now();

  -- Se tem office_id, criar registro em office_users
  IF link_record.office_id IS NOT NULL THEN
    INSERT INTO public.office_users (
      user_id,
      office_id,
      tenant_id,
      role,
      active
    ) VALUES (
      p_user_id,
      link_record.office_id,
      link_record.tenant_id,
      link_record.role,
      true
    ) ON CONFLICT (user_id, office_id) DO UPDATE SET
      role = EXCLUDED.role,
      active = true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', link_record.tenant_id,
    'role', link_record.role,
    'office_id', link_record.office_id,
    'department_id', link_record.department_id,
    'team_id', link_record.team_id
  );
END;
$function$;

-- Função para validar token público
CREATE OR REPLACE FUNCTION public.validate_public_invitation_token(p_token character varying)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  tenant_data record;
  office_data record;
  department_data record;
  team_data record;
BEGIN
  -- Buscar link válido
  SELECT * INTO link_record
  FROM public.public_invitation_links
  WHERE token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Link de convite inválido ou expirado'
    );
  END IF;

  -- Buscar dados do tenant
  SELECT name, slug INTO tenant_data
  FROM public.tenants
  WHERE id = link_record.tenant_id;

  -- Buscar dados do escritório se existir
  IF link_record.office_id IS NOT NULL THEN
    SELECT name INTO office_data
    FROM public.offices
    WHERE id = link_record.office_id;
  END IF;

  -- Buscar dados do departamento se existir
  IF link_record.department_id IS NOT NULL THEN
    SELECT name INTO department_data
    FROM public.departments
    WHERE id = link_record.department_id;
  END IF;

  -- Buscar dados da equipe se existir
  IF link_record.team_id IS NOT NULL THEN
    SELECT name INTO team_data
    FROM public.teams
    WHERE id = link_record.team_id;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'link_data', jsonb_build_object(
      'tenant_name', tenant_data.name,
      'tenant_slug', tenant_data.slug,
      'role', link_record.role,
      'office_name', office_data.name,
      'department_name', department_data.name,
      'team_name', team_data.name,
      'expires_at', link_record.expires_at,
      'max_uses', link_record.max_uses,
      'current_uses', link_record.current_uses
    )
  );
END;
$function$;
