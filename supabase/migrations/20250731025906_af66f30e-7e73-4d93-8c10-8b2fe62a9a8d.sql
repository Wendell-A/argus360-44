-- ETAPA 1: Correção das funções SQL restantes - Parte 3
-- Data: 29 de Janeiro de 2025, 14:10 UTC
-- Objetivo: Corrigir mais funções críticas com vulnerabilidades de search_path

-- 11. Corrigir get_user_menu_config
CREATE OR REPLACE FUNCTION public.get_user_menu_config(user_uuid uuid, tenant_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_context_result JSONB;
    menu_config JSONB := '{}';
    user_role user_role;
    context_level INTEGER;
BEGIN
    -- Obter contexto do usuário
    SELECT public.get_user_full_context(user_uuid, tenant_uuid) INTO user_context_result;
    
    IF user_context_result IS NULL THEN
        RETURN '{"error": "Contexto do usuário não encontrado"}'::JSONB;
    END IF;
    
    user_role := (user_context_result->>'role')::user_role;
    context_level := (user_context_result->>'context_level')::INTEGER;
    
    -- Configurar menu baseado no papel e contexto
    menu_config := jsonb_build_object(
        'role', user_role,
        'context_level', context_level,
        'modules', jsonb_build_object(
            'dashboard', TRUE,
            'crm', TRUE,
            'clients', TRUE,
            'sales', TRUE,
            'commissions', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'goals', TRUE,
            'reports', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'sellers', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'offices', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END,
            'departments', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END,
            'positions', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END,
            'teams', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'invitations', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END,
            'permissions', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END,
            'configurations', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END,
            'audit', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END
        ),
        'features', jsonb_build_object(
            'create_sales', TRUE,
            'edit_own_sales', TRUE,
            'edit_all_sales', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'delete_sales', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END,
            'view_all_clients', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'create_clients', TRUE,
            'edit_own_clients', TRUE,
            'edit_all_clients', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'view_commission_details', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'manage_goals', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'view_team_performance', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END
        )
    );
    
    RETURN menu_config;
END;
$$;

-- 12. Corrigir get_dashboard_stats_config
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_config(user_uuid uuid, tenant_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_context_result JSONB;
    stats_config JSONB := '{}';
    user_role user_role;
    accessible_offices UUID[];
BEGIN
    -- Obter contexto do usuário
    SELECT public.get_user_full_context(user_uuid, tenant_uuid) INTO user_context_result;
    
    IF user_context_result IS NULL THEN
        RETURN '{"error": "Contexto do usuário não encontrado"}'::JSONB;
    END IF;
    
    user_role := (user_context_result->>'role')::user_role;
    accessible_offices := ARRAY(SELECT jsonb_array_elements_text(user_context_result->'accessible_offices'))::UUID[];
    
    -- Configurar estatísticas baseadas no papel
    stats_config := jsonb_build_object(
        'role', user_role,
        'widgets', jsonb_build_object(
            'total_sales', TRUE,
            'total_clients', TRUE,
            'monthly_performance', TRUE,
            'personal_goals', TRUE,
            'team_performance', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'office_comparison', CASE 
                WHEN user_role IN ('owner', 'admin') THEN TRUE 
                ELSE FALSE 
            END,
            'commission_breakdown', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'top_sellers', CASE 
                WHEN user_role IN ('owner', 'admin', 'manager') THEN TRUE 
                ELSE FALSE 
            END,
            'recent_activities', TRUE,
            'pending_tasks', TRUE
        ),
        'data_scope', CASE 
            WHEN user_role IN ('owner', 'admin') THEN 'global'
            WHEN user_role = 'manager' THEN 'office'
            ELSE 'personal'
        END,
        'accessible_offices', accessible_offices
    );
    
    RETURN stats_config;
END;
$$;

-- 13. Corrigir log_contextual_audit_event
CREATE OR REPLACE FUNCTION public.log_contextual_audit_event(p_user_uuid uuid, p_tenant_uuid uuid, p_action text, p_resource_type text, p_resource_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_additional_context jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    audit_id UUID;
    user_context JSONB;
    enriched_context JSONB;
BEGIN
    -- Gerar ID único para o evento de auditoria
    audit_id := gen_random_uuid();
    
    -- Obter contexto completo do usuário
    SELECT public.get_user_full_context(p_user_uuid, p_tenant_uuid) INTO user_context;
    
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

-- 14. Corrigir get_contextual_audit_logs
CREATE OR REPLACE FUNCTION public.get_contextual_audit_logs(user_uuid uuid, tenant_uuid uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0, p_resource_type text DEFAULT NULL::text, p_action_filter text DEFAULT NULL::text, p_date_from timestamp without time zone DEFAULT NULL::timestamp without time zone, p_date_to timestamp without time zone DEFAULT NULL::timestamp without time zone)
RETURNS TABLE(id uuid, user_id uuid, tenant_id uuid, table_name character varying, record_id uuid, action character varying, old_values jsonb, new_values jsonb, ip_address inet, user_agent text, created_at timestamp with time zone, user_role text, context_level integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_role_val user_role;
    accessible_offices UUID[];
BEGIN
    -- Obter role e contexto do usuário
    SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
    SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
    
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
                    SELECT 1 FROM public.tenant_users tu 
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

-- 15. Corrigir get_security_monitoring_data
CREATE OR REPLACE FUNCTION public.get_security_monitoring_data(user_uuid uuid, tenant_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
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
    SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
    
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