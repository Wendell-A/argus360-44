
-- Criar tabela de convites
CREATE TABLE public.invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email character varying NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  token character varying NOT NULL UNIQUE,
  status character varying NOT NULL DEFAULT 'pending',
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Habilitar RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Owners can manage invitations" ON public.invitations
  FOR ALL TO authenticated
  USING (get_user_role_in_tenant(auth.uid(), tenant_id) = 'owner');

CREATE POLICY "Users can view invitations sent to their email" ON public.invitations
  FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Função para gerar token de convite
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS character varying
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Função para validar convite
CREATE OR REPLACE FUNCTION public.validate_invitation(invitation_token character varying)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record public.invitations%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Convite inválido ou expirado'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'invitation', row_to_json(invitation_record)
  );
END;
$$;

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token character varying,
  user_id uuid,
  user_email character varying,
  user_full_name character varying
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record public.invitations%ROWTYPE;
  result jsonb;
BEGIN
  -- Buscar convite válido
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND email = user_email;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite inválido ou expirado'
    );
  END IF;

  -- Marcar convite como aceito
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = invitation_record.id;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (user_id, user_email, user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Criar associação tenant_user
  INSERT INTO public.tenant_users (user_id, tenant_id, role, active, joined_at)
  VALUES (user_id, invitation_record.tenant_id, invitation_record.role, true, now())
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    role = EXCLUDED.role,
    active = true,
    joined_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', invitation_record.tenant_id,
    'role', invitation_record.role
  );
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
