-- Correção Definitiva: Validação Token Convite Público
-- Data: 2025-09-23
-- Resolver erro "record 'team_data' is not assigned yet"

-- 1) Corrigir função validate_public_invitation_token
CREATE OR REPLACE FUNCTION public.validate_public_invitation_token(p_token character varying)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  office_data RECORD := NULL;
  department_data RECORD := NULL;
  team_data RECORD := NULL;
BEGIN
  -- Buscar link público válido
  SELECT * INTO link_record
  FROM public.public_invitation_links pil
  WHERE pil.token = p_token
    AND pil.is_active = true
    AND (pil.expires_at IS NULL OR pil.expires_at > now())
    AND (pil.max_uses IS NULL OR pil.current_uses < pil.max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Link inválido ou expirado'
    );
  END IF;

  -- Buscar dados do escritório (se especificado)
  IF link_record.office_id IS NOT NULL THEN
    SELECT * INTO office_data
    FROM public.offices o
    WHERE o.id = link_record.office_id AND o.active = true;
  END IF;

  -- Buscar dados do departamento (se especificado)
  IF link_record.department_id IS NOT NULL THEN
    SELECT * INTO department_data
    FROM public.departments d
    WHERE d.id = link_record.department_id;
  END IF;

  -- Buscar dados da equipe (se especificado)
  IF link_record.team_id IS NOT NULL THEN
    SELECT * INTO team_data
    FROM public.teams t
    WHERE t.id = link_record.team_id AND t.active = true;
  END IF;

  -- Retornar dados válidos com acesso seguro
  RETURN jsonb_build_object(
    'valid', true,
    'link_data', jsonb_build_object(
      'id', link_record.id,
      'tenant_id', link_record.tenant_id,
      'role', link_record.role,
      'office_id', link_record.office_id,
      'department_id', link_record.department_id,
      'team_id', link_record.team_id,
      'office_name', CASE WHEN office_data IS NOT NULL THEN office_data.name ELSE NULL END,
      'department_name', CASE WHEN department_data IS NOT NULL THEN department_data.name ELSE NULL END, 
      'team_name', CASE WHEN team_data IS NOT NULL THEN team_data.name ELSE NULL END,
      'max_uses', link_record.max_uses,
      'current_uses', link_record.current_uses,
      'expires_at', link_record.expires_at
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log de erro para debugging
    RAISE LOG 'Erro na validação do token público: %, Token: %', SQLERRM, p_token;
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Erro interno na validação do link'
    );
END;
$$;

-- 2) Corrigir função accept_public_invitation para consistência
CREATE OR REPLACE FUNCTION public.accept_public_invitation(
  p_token character varying,
  p_user_id uuid,
  p_user_email character varying,
  p_user_full_name character varying
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  office_data RECORD := NULL;
BEGIN
  -- Validar o token primeiro
  SELECT * INTO link_record
  FROM public.public_invitation_links pil
  WHERE pil.token = p_token
    AND pil.is_active = true
    AND (pil.expires_at IS NULL OR pil.expires_at > now())
    AND (pil.max_uses IS NULL OR pil.current_uses < pil.max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Link inválido ou expirado'
    );
  END IF;

  -- Verificar se escritório ainda existe (se especificado)
  IF link_record.office_id IS NOT NULL THEN
    SELECT * INTO office_data
    FROM public.offices o
    WHERE o.id = link_record.office_id AND o.active = true;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Escritório associado ao link não está mais disponível'
      );
    END IF;
  END IF;

  -- Criar ou atualizar perfil do usuário
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_user_email, p_user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Criar associação com o tenant
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

  -- Incrementar contador de usos
  UPDATE public.public_invitation_links
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = link_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', link_record.tenant_id,
    'role', link_record.role,
    'office_name', CASE WHEN office_data IS NOT NULL THEN office_data.name ELSE NULL END,
    'message', 'Registro realizado com sucesso via link público'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro ao aceitar convite público: %, Token: %, User: %', SQLERRM, p_token, p_user_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Erro interno ao processar o registro'
    );
END;
$$;