-- Correção Completa Sistema de Links Públicos de Convite - Parte 1
-- Data: 2025-09-23
-- Remover funções existentes para recriação

-- Remover função problemática para recriação
DROP FUNCTION IF EXISTS public.accept_public_invitation(character varying, uuid, character varying, character varying);

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