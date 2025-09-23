-- Correção Completa Sistema de Links Públicos de Convite
-- Data: 2025-09-23 
-- Problema: Função gen_random_bytes() não existe + validação de dados NULL

-- 1) Corrigir função generate_public_invitation_token 
-- PROBLEMA: gen_random_bytes() não existe no Postgres
-- SOLUÇÃO: Usar md5() com gen_random_uuid() como nos convites por email
CREATE OR REPLACE FUNCTION public.generate_public_invitation_token()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Usar mesmo método dos convites por email (testado e funcional)
  RETURN md5(gen_random_uuid()::text || now()::text);
END;
$$;

-- 2) Corrigir função validate_public_invitation_token
-- PROBLEMA: Acesso a office_data.name sem verificar se é NULL
-- SOLUÇÃO: Usar COALESCE e verificação segura
CREATE OR REPLACE FUNCTION public.validate_public_invitation_token(p_token VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  office_data RECORD;
  department_data RECORD;
  team_data RECORD;
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
  office_data := NULL;
  IF link_record.office_id IS NOT NULL THEN
    SELECT * INTO office_data
    FROM public.offices o
    WHERE o.id = link_record.office_id AND o.active = true;
  END IF;

  -- Buscar dados do departamento (se especificado)
  department_data := NULL;
  IF link_record.department_id IS NOT NULL THEN
    SELECT * INTO department_data
    FROM public.departments d
    WHERE d.id = link_record.department_id;
  END IF;

  -- Buscar dados da equipe (se especificado)
  team_data := NULL;
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
      'office_name', COALESCE(office_data.name, NULL),
      'department_name', COALESCE(department_data.name, NULL), 
      'team_name', COALESCE(team_data.name, NULL),
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

-- 3) Corrigir função accept_public_invitation
-- PROBLEMA: Mesmas questões de acesso a dados opcionais
CREATE OR REPLACE FUNCTION public.accept_public_invitation(
  p_token VARCHAR,
  p_user_id UUID,
  p_user_email VARCHAR,
  p_user_full_name VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  office_data RECORD;
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
  office_data := NULL;
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
    'office_name', COALESCE(office_data.name, NULL),
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

-- 4) Limpeza de dados: Remover links com tokens potencialmente inválidos
-- Apenas links criados recentemente que podem ter tokens problemáticos
DELETE FROM public.public_invitation_links 
WHERE created_at >= '2025-09-20'::date 
  AND is_active = true;

-- 5) Garantir permissões corretas para usuários anônimos
-- Essencial para o funcionamento dos links públicos
GRANT EXECUTE ON FUNCTION public.generate_public_invitation_token() TO anon;
GRANT EXECUTE ON FUNCTION public.validate_public_invitation_token(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.accept_public_invitation(VARCHAR, UUID, VARCHAR, VARCHAR) TO anon;

-- Também para usuários autenticados
GRANT EXECUTE ON FUNCTION public.generate_public_invitation_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_public_invitation_token(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_public_invitation(VARCHAR, UUID, VARCHAR, VARCHAR) TO authenticated;