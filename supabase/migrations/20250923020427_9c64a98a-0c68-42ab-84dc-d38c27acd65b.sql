-- Correção Completa Sistema de Links Públicos de Convite - Parte 2
-- Data: 2025-09-23
-- Criar função accept_public_invitation e finalizações

-- 3) Criar função accept_public_invitation corrigida
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
GRANT EXECUTE ON FUNCTION public.generate_public_invitation_token() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_public_invitation_token(VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_public_invitation(VARCHAR, UUID, VARCHAR, VARCHAR) TO anon, authenticated;