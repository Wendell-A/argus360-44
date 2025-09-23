-- Corrigir as funções de validação e aceitação de convites públicos
-- Problema: RECORD variables não estão sendo inicializadas corretamente

-- Função validate_public_invitation_token corrigida
CREATE OR REPLACE FUNCTION public.validate_public_invitation_token(p_token character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  office_data RECORD;
  department_data RECORD;
  team_data RECORD;
  result_office_name TEXT := NULL;
  result_department_name TEXT := NULL;
  result_team_name TEXT := NULL;
BEGIN
  -- Log inicial para debugging
  RAISE LOG 'Validando token público: %', p_token;

  -- Buscar link público válido
  SELECT * INTO link_record
  FROM public.public_invitation_links pil
  WHERE pil.token = p_token
    AND pil.is_active = true
    AND (pil.expires_at IS NULL OR pil.expires_at > now())
    AND (pil.max_uses IS NULL OR pil.current_uses < pil.max_uses);

  IF NOT FOUND THEN
    RAISE LOG 'Token não encontrado ou inválido: %', p_token;
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Link inválido ou expirado'
    );
  END IF;

  RAISE LOG 'Link encontrado: tenant_id=%, office_id=%, department_id=%, team_id=%', 
    link_record.tenant_id, link_record.office_id, link_record.department_id, link_record.team_id;

  -- Buscar dados do escritório (se especificado e não nulo)
  IF link_record.office_id IS NOT NULL THEN
    SELECT name INTO result_office_name
    FROM public.offices o
    WHERE o.id = link_record.office_id AND o.active = true;
    
    IF result_office_name IS NULL THEN
      RAISE LOG 'Escritório não encontrado ou inativo: %', link_record.office_id;
    ELSE
      RAISE LOG 'Escritório encontrado: %', result_office_name;
    END IF;
  END IF;

  -- Buscar dados do departamento (se especificado e não nulo)
  IF link_record.department_id IS NOT NULL THEN
    SELECT name INTO result_department_name
    FROM public.departments d
    WHERE d.id = link_record.department_id;
    
    IF result_department_name IS NULL THEN
      RAISE LOG 'Departamento não encontrado: %', link_record.department_id;
    ELSE
      RAISE LOG 'Departamento encontrado: %', result_department_name;
    END IF;
  END IF;

  -- Buscar dados da equipe (se especificado e não nulo)
  IF link_record.team_id IS NOT NULL THEN
    SELECT name INTO result_team_name
    FROM public.teams t
    WHERE t.id = link_record.team_id AND t.active = true;
    
    IF result_team_name IS NULL THEN
      RAISE LOG 'Equipe não encontrada ou inativa: %', link_record.team_id;
    ELSE
      RAISE LOG 'Equipe encontrada: %', result_team_name;
    END IF;
  END IF;

  -- Retornar dados válidos
  RAISE LOG 'Retornando dados válidos para token: %', p_token;
  
  RETURN jsonb_build_object(
    'valid', true,
    'link_data', jsonb_build_object(
      'id', link_record.id,
      'tenant_id', link_record.tenant_id,
      'role', link_record.role,
      'office_id', link_record.office_id,
      'department_id', link_record.department_id,
      'team_id', link_record.team_id,
      'office_name', result_office_name,
      'department_name', result_department_name,
      'team_name', result_team_name,
      'max_uses', link_record.max_uses,
      'current_uses', link_record.current_uses,
      'expires_at', link_record.expires_at
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log detalhado do erro
    RAISE LOG 'ERRO na validação do token público: %, Token: %, SQLSTATE: %, SQLERRM: %', 
      SQLSTATE, p_token, SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Erro interno na validação do link: ' || SQLERRM
    );
END;
$function$;

-- Função accept_public_invitation corrigida
CREATE OR REPLACE FUNCTION public.accept_public_invitation(p_token character varying, p_user_id uuid, p_user_email character varying, p_user_full_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  office_data RECORD;
  result_office_name TEXT := NULL;
BEGIN
  -- Log inicial para debugging
  RAISE LOG 'Aceitando convite público: token=%, user_id=%, email=%', 
    p_token, p_user_id, p_user_email;

  -- Validar o token primeiro
  SELECT * INTO link_record
  FROM public.public_invitation_links pil
  WHERE pil.token = p_token
    AND pil.is_active = true
    AND (pil.expires_at IS NULL OR pil.expires_at > now())
    AND (pil.max_uses IS NULL OR pil.current_uses < pil.max_uses);

  IF NOT FOUND THEN
    RAISE LOG 'Token inválido ou expirado: %', p_token;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Link inválido ou expirado'
    );
  END IF;

  RAISE LOG 'Link válido encontrado: tenant_id=%, office_id=%', 
    link_record.tenant_id, link_record.office_id;

  -- Verificar se escritório ainda existe (se especificado e não nulo)
  IF link_record.office_id IS NOT NULL THEN
    SELECT name INTO result_office_name
    FROM public.offices o
    WHERE o.id = link_record.office_id AND o.active = true;
    
    IF result_office_name IS NULL THEN
      RAISE LOG 'Escritório associado não está disponível: %', link_record.office_id;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Escritório associado ao link não está mais disponível'
      );
    END IF;
    
    RAISE LOG 'Escritório válido: %', result_office_name;
  END IF;

  -- Criar ou atualizar perfil do usuário
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_user_email, p_user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  RAISE LOG 'Perfil criado/atualizado para usuário: %', p_user_id;

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

  RAISE LOG 'Associação tenant_user criada: user_id=%, tenant_id=%', 
    p_user_id, link_record.tenant_id;

  -- Incrementar contador de usos
  UPDATE public.public_invitation_links
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = link_record.id;

  RAISE LOG 'Contador de usos incrementado para link: %', link_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', link_record.tenant_id,
    'role', link_record.role,
    'office_name', result_office_name,
    'message', 'Registro realizado com sucesso via link público'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log detalhado do erro
    RAISE LOG 'ERRO ao aceitar convite público: %, Token: %, User: %, SQLSTATE: %, SQLERRM: %', 
      SQLSTATE, p_token, p_user_id, SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Erro interno ao processar o registro: ' || SQLERRM
    );
END;
$function$;

-- Criar função para gerar token público se não existir
CREATE OR REPLACE FUNCTION public.generate_public_invitation_token()
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Gerar token único de 32 caracteres usando md5 com uuid e timestamp
  RETURN md5(gen_random_uuid()::text || now()::text);
END;
$function$;

-- Garantir permissões para funções públicas
GRANT EXECUTE ON FUNCTION public.validate_public_invitation_token(character varying) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_public_invitation(character varying, uuid, character varying, character varying) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_public_invitation_token() TO authenticated;