-- Finalizando correções das funções SQL restantes - Parte 3

-- 18. Corrigir can_user_perform_action
CREATE OR REPLACE FUNCTION public.can_user_perform_action(user_uuid uuid, tenant_uuid uuid, action_type text, resource_type text, resource_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_val user_role;
  user_offices uuid[];
  can_perform boolean := false;
BEGIN
  -- Obter role e contexto do usuário
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO user_offices;
  
  -- Owner e Admin podem fazer tudo
  IF user_role_val IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Verificações específicas por tipo de recurso
  CASE resource_type
    WHEN 'client' THEN
      IF action_type IN ('read', 'create', 'update', 'delete') THEN
        -- Manager pode gerenciar clientes dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          -- Se resource_id fornecido, verificar se cliente está em escritório acessível
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.clients 
              WHERE id = resource_id 
              AND office_id = ANY(user_offices)
            ) INTO can_perform;
          ELSE
            can_perform := true; -- Pode criar/listar dentro do contexto
          END IF;
        -- User pode gerenciar apenas clientes sob responsabilidade
        ELSIF user_role_val = 'user' AND action_type != 'delete' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.clients 
              WHERE id = resource_id 
              AND responsible_user_id = user_uuid
            ) INTO can_perform;
          ELSE
            can_perform := true; -- Pode criar/listar próprios clientes
          END IF;
        END IF;
      END IF;
      
    WHEN 'sale' THEN
      IF action_type IN ('read', 'create', 'update') THEN
        -- Manager pode gerenciar vendas dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.sales 
              WHERE id = resource_id 
              AND office_id = ANY(user_offices)
            ) INTO can_perform;
          ELSE
            can_perform := true;
          END IF;
        -- User pode gerenciar apenas próprias vendas
        ELSIF user_role_val = 'user' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.sales 
              WHERE id = resource_id 
              AND seller_id = user_uuid
            ) INTO can_perform;
          ELSE
            can_perform := true;
          END IF;
        END IF;
      END IF;
      
    WHEN 'commission' THEN
      IF action_type = 'read' THEN
        -- Manager pode ver comissões dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          can_perform := true; -- RLS já filtra
        -- User pode ver apenas próprias comissões
        ELSIF user_role_val = 'user' THEN
          can_perform := true; -- RLS já filtra
        END IF;
      -- Apenas Manager+ podem gerenciar comissões
      ELSIF action_type IN ('create', 'update', 'delete') AND user_role_val = 'manager' THEN
        can_perform := true;
      END IF;
      
    ELSE
      -- Para outros recursos, usar lógica padrão de role
      can_perform := user_role_val IN ('manager', 'user') AND action_type IN ('read', 'create', 'update');
  END CASE;
  
  RETURN can_perform;
END;
$function$;

-- 19. Corrigir create_super_admin
CREATE OR REPLACE FUNCTION public.create_super_admin(p_email character varying, p_password character varying, p_full_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public, extensions'
AS $function$
DECLARE 
  result jsonb;
BEGIN
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM public.super_admins WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email já está em uso'
    );
  END IF;

  -- Inserir novo super admin com hash seguro
  INSERT INTO public.super_admins (
    email, 
    password_hash, 
    full_name
  ) VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    p_full_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Super administrador criado com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- 20. Corrigir get_audit_statistics
CREATE OR REPLACE FUNCTION public.get_audit_statistics(user_uuid uuid, tenant_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    user_role_val user_role;
    accessible_offices UUID[];
    stats JSONB;
    total_events INTEGER;
    events_today INTEGER;
    events_this_week INTEGER;
    top_actions JSONB;
    top_users JSONB;
BEGIN
    -- Obter contexto do usuário
    SELECT get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
    SELECT get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
    
    -- Contar total de eventos que o usuário pode ver
    SELECT COUNT(*) INTO total_events
    FROM public.audit_log al
    WHERE al.tenant_id = tenant_uuid
        AND (
            user_role_val IN ('owner', 'admin')
            OR (user_role_val = 'manager' AND (
                al.user_id = user_uuid
                OR EXISTS (
                    SELECT 1 FROM tenant_users tu 
                    WHERE tu.user_id = al.user_id 
                        AND tu.tenant_id = al.tenant_id 
                        AND tu.office_id = ANY(accessible_offices)
                )
            ))
            OR (user_role_val IN ('user', 'viewer') AND al.user_id = user_uuid)
        );
    
    -- Eventos de hoje
    SELECT COUNT(*) INTO events_today
    FROM public.audit_log al
    WHERE al.tenant_id = tenant_uuid
        AND DATE(al.created_at) = CURRENT_DATE
        AND (
            user_role_val IN ('owner', 'admin')
            OR (user_role_val = 'manager' AND (
                al.user_id = user_uuid
                OR EXISTS (
                    SELECT 1 FROM tenant_users tu 
                    WHERE tu.user_id = al.user_id 
                        AND tu.tenant_id = al.tenant_id 
                        AND tu.office_id = ANY(accessible_offices)
                )
            ))
            OR (user_role_val IN ('user', 'viewer') AND al.user_id = user_uuid)
        );
    
    -- Eventos desta semana
    SELECT COUNT(*) INTO events_this_week
    FROM public.audit_log al
    WHERE al.tenant_id = tenant_uuid
        AND al.created_at >= date_trunc('week', CURRENT_DATE)
        AND (
            user_role_val IN ('owner', 'admin')
            OR (user_role_val = 'manager' AND (
                al.user_id = user_uuid
                OR EXISTS (
                    SELECT 1 FROM tenant_users tu 
                    WHERE tu.user_id = al.user_id 
                        AND tu.tenant_id = al.tenant_id 
                        AND tu.office_id = ANY(accessible_offices)
                )
            ))
            OR (user_role_val IN ('user', 'viewer') AND al.user_id = user_uuid)
        );
    
    -- Top ações (apenas para admin+)
    IF user_role_val IN ('owner', 'admin') THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'action', action,
                'count', count
            )
        ) INTO top_actions
        FROM (
            SELECT action, COUNT(*) as count
            FROM public.audit_log
            WHERE tenant_id = tenant_uuid
                AND created_at >= now() - INTERVAL '7 days'
            GROUP BY action
            ORDER BY count DESC
            LIMIT 5
        ) t;
        
        SELECT jsonb_agg(
            jsonb_build_object(
                'user_id', user_id,
                'count', count
            )
        ) INTO top_users
        FROM (
            SELECT user_id, COUNT(*) as count
            FROM public.audit_log
            WHERE tenant_id = tenant_uuid
                AND created_at >= now() - INTERVAL '7 days'
            GROUP BY user_id
            ORDER BY count DESC
            LIMIT 5
        ) t;
    END IF;
    
    -- Montar estatísticas
    stats := jsonb_build_object(
        'total_events', total_events,
        'events_today', events_today,
        'events_this_week', events_this_week,
        'user_role', user_role_val,
        'context_level', CASE 
            WHEN user_role_val IN ('owner', 'admin') THEN 1
            WHEN user_role_val = 'manager' THEN 2
            ELSE 4
        END
    );
    
    -- Adicionar dados detalhados apenas para admin+
    IF user_role_val IN ('owner', 'admin') THEN
        stats := stats || jsonb_build_object(
            'top_actions', COALESCE(top_actions, '[]'::jsonb),
            'top_users', COALESCE(top_users, '[]'::jsonb)
        );
    END IF;
    
    RETURN stats;
END;
$function$;

-- 21. Corrigir process_invitation_on_auth
CREATE OR REPLACE FUNCTION public.process_invitation_on_auth(p_user_id uuid, p_email character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 22. Corrigir send_invitation_via_auth
CREATE OR REPLACE FUNCTION public.send_invitation_via_auth(p_tenant_id uuid, p_email character varying, p_role user_role DEFAULT 'user'::user_role, p_redirect_to character varying DEFAULT NULL::character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 23. Corrigir send_invitation_automatic
CREATE OR REPLACE FUNCTION public.send_invitation_automatic()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  request_id bigint;
  invitation_data jsonb;
  supabase_url text := 'https://ipmdzigjpthmaeyhejdl.supabase.co';
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbWR6aWdqcHRobWFleWhlamRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxNzQwMCwiZXhwIjoyMDY4MDkzNDAwfQ.oLnLuCfUPl_7c8YcPy8XTlm7JqyM0XkFbgBxKhH0UWo';
BEGIN
  -- Preparar dados do convite
  invitation_data := jsonb_build_object(
    'invitation_id', NEW.id,
    'email', NEW.email,
    'tenant_id', NEW.tenant_id,
    'role', NEW.role
  );

  -- Usar pg_net para chamar a edge function de forma assíncrona
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/send-invitation-auto',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := invitation_data,
    timeout_milliseconds := 15000
  ) INTO request_id;

  -- Log para debugging
  RAISE LOG 'Invitation auto-send triggered for % with request_id %', NEW.email, request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log o erro mas não falha a operação de inserção
    RAISE LOG 'Failed to trigger auto invitation for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$function$;

-- 24. Corrigir get_contextual_clients
CREATE OR REPLACE FUNCTION public.get_contextual_clients(user_uuid uuid, tenant_uuid uuid)
 RETURNS TABLE(id uuid, name character varying, email character varying, phone character varying, document character varying, type character varying, status character varying, office_id uuid, responsible_user_id uuid, classification character varying, monthly_income numeric, birth_date date, occupation character varying, secondary_phone character varying, address jsonb, notes text, source character varying, settings jsonb, created_at timestamp with time zone, updated_at timestamp with time zone, tenant_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
BEGIN
  -- Obter role e escritórios acessíveis
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
  
  -- Filtrar clientes baseado no contexto
  RETURN QUERY
  SELECT c.*
  FROM public.clients c
  WHERE c.tenant_id = tenant_uuid
    AND (
      -- Owner/Admin: todos os clientes
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: clientes dos escritórios acessíveis
      (user_role_val = 'manager' AND c.office_id = ANY(accessible_offices))
      OR
      -- User/Viewer: apenas clientes sob responsabilidade ou do mesmo escritório
      (user_role_val IN ('user', 'viewer') AND 
       (c.responsible_user_id = user_uuid OR c.office_id = ANY(accessible_offices)))
    );
END;
$function$;