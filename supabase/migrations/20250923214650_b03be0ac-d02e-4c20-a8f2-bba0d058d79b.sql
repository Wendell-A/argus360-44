-- Correção Crítica de Segurança: RLS Policies para Super Admins
-- Data: 23/09/2025

-- 1. Remover política insegura existente
DROP POLICY IF EXISTS "Super admins can manage themselves" ON public.super_admins;

-- 2. Criar função auxiliar para validar se é um super admin autenticado
CREATE OR REPLACE FUNCTION public.is_authenticated_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record public.super_admins%ROWTYPE;
  session_header text;
BEGIN
  -- Tentar obter token do header da requisição
  BEGIN
    session_header := current_setting('request.headers', true)::json->>'authorization';
    
    -- Extrair token removendo "Bearer " se presente
    IF session_header IS NOT NULL AND session_header LIKE 'Bearer %' THEN
      session_header := substring(session_header from 8);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      session_header := NULL;
  END;
  
  -- Se não há token, não é super admin autenticado
  IF session_header IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se existe sessão válida para este token
  SELECT * INTO admin_record
  FROM public.super_admins sa
  WHERE sa.session_token = session_header
    AND sa.is_active = true
    AND sa.session_expires_at > now();
    
  RETURN FOUND;
END;
$$;

-- 3. Políticas RLS restritivas para super_admins

-- SELECT: Apenas super admins autenticados podem ver seus próprios dados
CREATE POLICY "Super admins can view their own data"
ON public.super_admins
FOR SELECT
USING (
  -- Permitir acesso apenas se é um super admin autenticado
  -- e está visualizando seus próprios dados
  public.is_authenticated_super_admin() AND
  session_token = (
    SELECT substring(
      current_setting('request.headers', true)::json->>'authorization' 
      from 8
    )
  )
);

-- INSERT: Ninguém pode inserir diretamente (apenas via função create_super_admin)
CREATE POLICY "Restrict direct insert to super_admins"
ON public.super_admins
FOR INSERT
WITH CHECK (false);

-- UPDATE: Apenas super admins autenticados podem atualizar seus próprios dados
CREATE POLICY "Super admins can update their own data"
ON public.super_admins
FOR UPDATE
USING (
  public.is_authenticated_super_admin() AND
  session_token = (
    SELECT substring(
      current_setting('request.headers', true)::json->>'authorization' 
      from 8
    )
  )
);

-- DELETE: Ninguém pode deletar super admins diretamente
CREATE POLICY "Restrict delete from super_admins"
ON public.super_admins
FOR DELETE
USING (false);

-- 4. Garantir que as funções SECURITY DEFINER continuem funcionando
-- (Elas já têm privilégios para bypassar RLS)

-- 5. Função adicional para validação segura de super admin no frontend
CREATE OR REPLACE FUNCTION public.get_current_super_admin_safe()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record public.super_admins%ROWTYPE;
  session_header text;
BEGIN
  -- Obter token do header
  BEGIN
    session_header := current_setting('request.headers', true)::json->>'authorization';
    
    IF session_header IS NOT NULL AND session_header LIKE 'Bearer %' THEN
      session_header := substring(session_header from 8);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('authenticated', false);
  END;
  
  IF session_header IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;
  
  -- Buscar super admin válido
  SELECT * INTO admin_record
  FROM public.super_admins sa
  WHERE sa.session_token = session_header
    AND sa.is_active = true
    AND sa.session_expires_at > now();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;
  
  -- Retornar dados seguros (sem password_hash e session_token)
  RETURN jsonb_build_object(
    'authenticated', true,
    'id', admin_record.id,
    'email', admin_record.email,
    'full_name', admin_record.full_name,
    'is_active', admin_record.is_active,
    'last_login', admin_record.last_login,
    'created_at', admin_record.created_at
  );
END;
$$;