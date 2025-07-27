-- Implementar sistema de convites seguindo padrão Supabase

-- Remover tabela de convites customizada e usar o sistema nativo do Supabase
-- O Supabase já tem um sistema de convites integrado ao sistema de autenticação

-- Vamos criar uma tabela simplificada para armazenar metadados dos convites
DROP TABLE IF EXISTS public.invitations CASCADE;

CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  email varchar NOT NULL,
  invited_by uuid NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies para invitations
CREATE POLICY "Owners and admins can manage invitations" ON public.invitations
  FOR ALL USING (get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin'));

CREATE POLICY "Users can view invitations sent to their email" ON public.invitations
  FOR SELECT USING (
    email IN (
      SELECT jsonb_extract_path_text(get_authenticated_user_data(), 'email')
      WHERE (jsonb_extract_path_text(get_authenticated_user_data(), 'authenticated'))::boolean = true
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para processar convite via Supabase Auth
CREATE OR REPLACE FUNCTION public.send_invitation_via_auth(
  p_tenant_id uuid,
  p_email varchar,
  p_role user_role DEFAULT 'user',
  p_redirect_to varchar DEFAULT null
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record record;
  result jsonb;
BEGIN
  -- Verificar permissões
  IF NOT (get_user_role_in_tenant(auth.uid(), p_tenant_id) IN ('owner', 'admin')) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permissão negada para enviar convites'
    );
  END IF;

  -- Verificar se já existe convite para este email/tenant
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE tenant_id = p_tenant_id AND email = p_email;

  -- Se já existe, atualizar
  IF FOUND THEN
    UPDATE public.invitations
    SET role = p_role,
        invited_by = auth.uid(),
        updated_at = now(),
        metadata = jsonb_build_object(
          'redirect_to', COALESCE(p_redirect_to, '/dashboard'),
          'tenant_id', p_tenant_id,
          'role', p_role
        )
    WHERE id = invitation_record.id;
  ELSE
    -- Criar novo convite
    INSERT INTO public.invitations (
      tenant_id,
      email,
      invited_by,
      role,
      metadata
    ) VALUES (
      p_tenant_id,
      p_email,
      auth.uid(),
      p_role,
      jsonb_build_object(
        'redirect_to', COALESCE(p_redirect_to, '/dashboard'),
        'tenant_id', p_tenant_id,
        'role', p_role
      )
    ) RETURNING * INTO invitation_record;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_record.id,
    'message', 'Use o admin panel do Supabase para enviar o email de convite'
  );
END;
$$;

-- Função para aceitar convite quando usuário se registra/faz login
CREATE OR REPLACE FUNCTION public.process_invitation_on_auth(
  p_user_id uuid,
  p_email varchar
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record record;
  result jsonb;
BEGIN
  -- Buscar convites pendentes para este email
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = p_email
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Nenhum convite encontrado para este email'
    );
  END IF;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, p_email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  -- Criar associação tenant_user
  INSERT INTO public.tenant_users (
    user_id,
    tenant_id,
    role,
    active,
    joined_at
  ) VALUES (
    p_user_id,
    invitation_record.tenant_id,
    invitation_record.role,
    true,
    now()
  ) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    role = EXCLUDED.role,
    active = true,
    joined_at = now();

  -- Remover convite após aceito
  DELETE FROM public.invitations WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', invitation_record.tenant_id,
    'role', invitation_record.role,
    'message', 'Convite aceito com sucesso'
  );
END;
$$;