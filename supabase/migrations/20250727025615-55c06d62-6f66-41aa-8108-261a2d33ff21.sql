-- Implementar sistema automático de convites com trigger

-- Função para enviar convite automaticamente via edge function
CREATE OR REPLACE FUNCTION public.send_invitation_automatic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_data jsonb;
BEGIN
  -- Preparar dados do convite
  invitation_data := jsonb_build_object(
    'invitation_id', NEW.id,
    'email', NEW.email,
    'tenant_id', NEW.tenant_id,
    'role', NEW.role
  );

  -- Chamar edge function para enviar email via Supabase Auth
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-invitation-auto',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := invitation_data
  );

  RETURN NEW;
END;
$$;

-- Criar trigger para enviar convites automaticamente
DROP TRIGGER IF EXISTS trigger_send_invitation_auto ON public.invitations;
CREATE TRIGGER trigger_send_invitation_auto
  AFTER INSERT ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.send_invitation_automatic();

-- Configurar variáveis necessárias (estas devem ser definidas no Supabase)
-- As variáveis serão configuradas via SQL direto pois são específicas do projeto

-- Atualizar função para criar convites sem precisar de ação manual
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

  -- Se já existe, deletar e criar novo (trigger irá enviar email automaticamente)
  IF FOUND THEN
    DELETE FROM public.invitations WHERE id = invitation_record.id;
  END IF;

  -- Criar novo convite (trigger será executado automaticamente)
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

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', invitation_record.id,
    'message', 'Convite criado e email enviado automaticamente'
  );
END;
$$;