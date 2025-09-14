-- Corrigir função de validação de tokens públicos
CREATE OR REPLACE FUNCTION public.validate_public_invitation_token(p_token VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  link_record RECORD;
  tenant_data RECORD;
  office_data RECORD;
  department_data RECORD;
  team_data RECORD;
BEGIN
  -- Log da função
  RAISE NOTICE 'Validando token: %', p_token;
  
  -- Buscar link pelo token
  SELECT * INTO link_record
  FROM public_invitation_links 
  WHERE token = p_token;
  
  -- Verificar se o token existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Token não encontrado'
    );
  END IF;
  
  -- Verificar se o link está ativo
  IF NOT link_record.is_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Link desativado'
    );
  END IF;
  
  -- Verificar se o link expirou
  IF link_record.expires_at IS NOT NULL AND link_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Link expirado'
    );
  END IF;
  
  -- Verificar se atingiu o limite de usos
  IF link_record.max_uses IS NOT NULL AND link_record.current_uses >= link_record.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Limite de usos atingido'
    );
  END IF;
  
  -- Buscar dados do tenant
  SELECT * INTO tenant_data
  FROM tenants 
  WHERE id = link_record.tenant_id;
  
  -- Buscar dados do office (opcional)
  IF link_record.office_id IS NOT NULL THEN
    SELECT * INTO office_data
    FROM offices 
    WHERE id = link_record.office_id;
  END IF;
  
  -- Buscar dados do department (opcional)
  IF link_record.department_id IS NOT NULL THEN
    SELECT * INTO department_data
    FROM departments 
    WHERE id = link_record.department_id;
  END IF;
  
  -- Buscar dados do team (opcional)
  IF link_record.team_id IS NOT NULL THEN
    SELECT * INTO team_data
    FROM teams 
    WHERE id = link_record.team_id;
  END IF;
  
  -- Retornar dados válidos
  RETURN jsonb_build_object(
    'valid', true,
    'link_data', jsonb_build_object(
      'id', link_record.id,
      'tenant_id', link_record.tenant_id,
      'tenant_name', COALESCE(tenant_data.name, 'Organização'),
      'tenant_slug', COALESCE(tenant_data.slug, ''),
      'role', link_record.role,
      'office_id', link_record.office_id,
      'office_name', COALESCE(office_data.name, NULL),
      'department_id', link_record.department_id,
      'department_name', COALESCE(department_data.name, NULL),
      'team_id', link_record.team_id,
      'team_name', COALESCE(team_data.name, NULL),
      'expires_at', link_record.expires_at,
      'max_uses', link_record.max_uses,
      'current_uses', link_record.current_uses,
      'metadata', link_record.metadata
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro na validação do token: %', SQLERRM;
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Erro interno na validação'
    );
END;
$$;