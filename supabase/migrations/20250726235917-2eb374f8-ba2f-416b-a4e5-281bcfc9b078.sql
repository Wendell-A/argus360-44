-- Etapa 5: Auditoria e Segurança - RBAC
-- Sistema avançado de auditoria contextual e monitoramento de segurança

-- Função para registrar eventos de auditoria contextuais
CREATE OR REPLACE FUNCTION log_contextual_audit_event(
    p_user_uuid UUID,
    p_tenant_uuid UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_additional_context JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    audit_id UUID;
    user_context JSONB;
    enriched_context JSONB;
BEGIN
    -- Gerar ID único para o evento de auditoria
    audit_id := gen_random_uuid();
    
    -- Obter contexto completo do usuário
    SELECT get_user_full_context(p_user_uuid, p_tenant_uuid) INTO user_context;
    
    -- Enriquecer contexto com informações adicionais
    enriched_context := jsonb_build_object(
        'user_role', user_context->>'role',
        'context_level', user_context->>'context_level',
        'accessible_offices', user_context->'accessible_offices',
        'session_info', p_additional_context,
        'timestamp', extract(epoch from now()),
        'user_agent', current_setting('request.headers', true)::json->>'user-agent',
        'ip_address', inet_client_addr()
    );
    
    -- Inserir evento de auditoria
    INSERT INTO public.audit_log (
        id,
        tenant_id,
        user_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        audit_id,
        p_tenant_uuid,
        p_user_uuid,
        p_resource_type,
        p_resource_id,
        p_action,
        CASE 
            WHEN p_old_values IS NOT NULL THEN 
                p_old_values || jsonb_build_object('audit_context', enriched_context)
            ELSE 
                jsonb_build_object('audit_context', enriched_context)
        END,
        CASE 
            WHEN p_new_values IS NOT NULL THEN 
                p_new_values || jsonb_build_object('audit_context', enriched_context)
            ELSE 
                jsonb_build_object('audit_context', enriched_context)
        END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        now()
    );
    
    RETURN audit_id;
END;
$$;

-- Função para obter logs de auditoria contextuais
CREATE OR REPLACE FUNCTION get_contextual_audit_logs(
    user_uuid UUID, 
    tenant_uuid UUID,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0,
    p_resource_type TEXT DEFAULT NULL,
    p_action_filter TEXT DEFAULT NULL,
    p_date_from TIMESTAMP DEFAULT NULL,
    p_date_to TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    tenant_id UUID,
    table_name VARCHAR,
    record_id UUID,
    action VARCHAR,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    user_role TEXT,
    context_level INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    user_role_val user_role;
    accessible_offices UUID[];
BEGIN
    -- Obter role e contexto do usuário
    SELECT get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
    SELECT get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
    
    -- Retornar logs baseados no contexto
    RETURN QUERY
    SELECT 
        al.id,
        al.user_id,
        al.tenant_id,
        al.table_name,
        al.record_id,
        al.action,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.created_at,
        COALESCE(al.new_values->'audit_context'->>'user_role', al.old_values->'audit_context'->>'user_role')::TEXT as user_role,
        COALESCE(
            (al.new_values->'audit_context'->>'context_level')::INTEGER,
            (al.old_values->'audit_context'->>'context_level')::INTEGER
        ) as context_level
    FROM public.audit_log al
    WHERE al.tenant_id = tenant_uuid
        AND (
            -- Owner/Admin podem ver todos os logs
            user_role_val IN ('owner', 'admin')
            OR
            -- Manager pode ver logs dos seus escritórios
            (user_role_val = 'manager' AND (
                al.user_id = user_uuid
                OR EXISTS (
                    SELECT 1 FROM tenant_users tu 
                    WHERE tu.user_id = al.user_id 
                        AND tu.tenant_id = al.tenant_id 
                        AND tu.office_id = ANY(accessible_offices)
                )
            ))
            OR
            -- User pode ver apenas seus próprios logs
            (user_role_val IN ('user', 'viewer') AND al.user_id = user_uuid)
        )
        AND (p_resource_type IS NULL OR al.table_name = p_resource_type)
        AND (p_action_filter IS NULL OR al.action = p_action_filter)
        AND (p_date_from IS NULL OR al.created_at >= p_date_from)
        AND (p_date_to IS NULL OR al.created_at <= p_date_to)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Função para monitoramento de segurança em tempo real
CREATE OR REPLACE FUNCTION get_security_monitoring_data(user_uuid UUID, tenant_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    user_role_val user_role;
    monitoring_data JSONB;
    failed_logins INTEGER;
    suspicious_activities INTEGER;
    recent_admin_actions INTEGER;
    active_sessions INTEGER;
BEGIN
    -- Verificar permissões (apenas admin+ podem ver dados de segurança)
    SELECT get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
    
    IF user_role_val NOT IN ('owner', 'admin') THEN
        RETURN jsonb_build_object('error', 'Acesso negado');
    END IF;
    
    -- Contar tentativas de login falhadas nas últimas 24h
    SELECT COUNT(*) INTO failed_logins
    FROM public.audit_log
    WHERE tenant_id = tenant_uuid
        AND action = 'FAILED_LOGIN'
        AND created_at >= now() - INTERVAL '24 hours';
    
    -- Contar atividades suspeitas (múltiplas tentativas do mesmo IP)
    SELECT COUNT(DISTINCT ip_address) INTO suspicious_activities
    FROM public.audit_log
    WHERE tenant_id = tenant_uuid
        AND created_at >= now() - INTERVAL '1 hour'
    GROUP BY ip_address
    HAVING COUNT(*) > 10;
    
    -- Contar ações administrativas recentes
    SELECT COUNT(*) INTO recent_admin_actions
    FROM public.audit_log al
    WHERE al.tenant_id = tenant_uuid
        AND al.created_at >= now() - INTERVAL '24 hours'
        AND (
            al.action IN ('CREATE', 'UPDATE', 'DELETE')
            AND al.table_name IN ('tenant_users', 'invitations', 'permissions', 'roles')
        );
    
    -- Estimar sessões ativas (baseado em atividade recente)
    SELECT COUNT(DISTINCT user_id) INTO active_sessions
    FROM public.audit_log
    WHERE tenant_id = tenant_uuid
        AND created_at >= now() - INTERVAL '30 minutes';
    
    -- Montar dados de monitoramento
    monitoring_data := jsonb_build_object(
        'failed_logins_24h', failed_logins,
        'suspicious_ips', suspicious_activities,
        'admin_actions_24h', recent_admin_actions,
        'active_sessions', active_sessions,
        'last_updated', now(),
        'security_level', CASE 
            WHEN failed_logins > 20 OR suspicious_activities > 5 THEN 'HIGH'
            WHEN failed_logins > 10 OR suspicious_activities > 2 THEN 'MEDIUM'
            ELSE 'LOW'
        END
    );
    
    RETURN monitoring_data;
END;
$$;

-- Função para estatísticas de auditoria por contexto
CREATE OR REPLACE FUNCTION get_audit_statistics(user_uuid UUID, tenant_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
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
$$;