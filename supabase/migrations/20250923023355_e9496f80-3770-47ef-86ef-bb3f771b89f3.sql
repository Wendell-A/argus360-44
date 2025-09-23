-- Atualização: robustez na checagem de equipe quando a tabela não existir
CREATE OR REPLACE FUNCTION public.validate_public_invitation_token(p_token character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  result_office_name TEXT := NULL;
  result_department_name TEXT := NULL;
  result_team_name TEXT := NULL;
BEGIN
  RAISE LOG 'Validando token público (v2): %', p_token;

  SELECT * INTO link_record
  FROM public.public_invitation_links pil
  WHERE pil.token = p_token
    AND pil.is_active = true
    AND (pil.expires_at IS NULL OR pil.expires_at > now())
    AND (pil.max_uses IS NULL OR pil.current_uses < pil.max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Link inválido ou expirado');
  END IF;

  IF link_record.office_id IS NOT NULL THEN
    SELECT name INTO result_office_name FROM public.offices o WHERE o.id = link_record.office_id AND o.active = true;
  END IF;

  IF link_record.department_id IS NOT NULL THEN
    SELECT name INTO result_department_name FROM public.departments d WHERE d.id = link_record.department_id;
  END IF;

  IF link_record.team_id IS NOT NULL AND to_regclass('public.teams') IS NOT NULL THEN
    SELECT name INTO result_team_name FROM public.teams t WHERE t.id = link_record.team_id AND t.active = true;
  ELSIF link_record.team_id IS NOT NULL THEN
    RAISE LOG 'Tabela public.teams não existe; pulando verificação de equipe';
  END IF;

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
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'ERRO validate_public_invitation_token(v2): %, token=%', SQLERRM, p_token;
  RETURN jsonb_build_object('valid', false, 'error', 'Erro interno na validação do link: ' || SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_public_invitation(p_token character varying, p_user_id uuid, p_user_email character varying, p_user_full_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  result_office_name TEXT := NULL;
BEGIN
  RAISE LOG 'Aceitando convite público (v2): token=%, user_id=%', p_token, p_user_id;

  SELECT * INTO link_record
  FROM public.public_invitation_links pil
  WHERE pil.token = p_token
    AND pil.is_active = true
    AND (pil.expires_at IS NULL OR pil.expires_at > now())
    AND (pil.max_uses IS NULL OR pil.current_uses < pil.max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link inválido ou expirado');
  END IF;

  IF link_record.office_id IS NOT NULL THEN
    SELECT name INTO result_office_name FROM public.offices o WHERE o.id = link_record.office_id AND o.active = true;
    IF result_office_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Escritório associado ao link não está mais disponível');
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_user_email, p_user_full_name)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

  INSERT INTO public.tenant_users (
    user_id, tenant_id, role, office_id, department_id, team_id, active, joined_at
  ) VALUES (
    p_user_id, link_record.tenant_id, link_record.role, link_record.office_id, link_record.department_id, link_record.team_id, true, now()
  ) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    role = EXCLUDED.role,
    office_id = EXCLUDED.office_id,
    department_id = EXCLUDED.department_id,
    team_id = EXCLUDED.team_id,
    active = true,
    joined_at = now();

  UPDATE public.public_invitation_links SET current_uses = current_uses + 1, updated_at = now() WHERE id = link_record.id;

  RETURN jsonb_build_object('success', true, 'tenant_id', link_record.tenant_id, 'role', link_record.role, 'office_name', result_office_name, 'message', 'Registro realizado com sucesso via link público');
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'ERRO accept_public_invitation(v2): %, token=%, user_id=%', SQLERRM, p_token, p_user_id;
  RETURN jsonb_build_object('success', false, 'error', 'Erro interno ao processar o registro: ' || SQLERRM);
END;
$function$;