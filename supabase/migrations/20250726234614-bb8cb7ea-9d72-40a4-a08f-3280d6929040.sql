-- Etapa 4: Interface Adaptativa - RBAC
-- Funções auxiliares para personalização da interface baseada no contexto do usuário

-- Função para obter configurações de menu baseadas no contexto do usuário
CREATE OR REPLACE FUNCTION get_user_menu_config(user_uuid UUID, tenant_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_context_result JSONB;
    menu_config JSONB := '{}';
    user_role user_role;
    context_level INTEGER;
BEGIN
    -- Obter contexto do usuário
    SELECT get_user_full_context(user_uuid, tenant_uuid) INTO user_context_result;
    
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

-- Função para obter estatísticas do dashboard baseadas no contexto
CREATE OR REPLACE FUNCTION get_dashboard_stats_config(user_uuid UUID, tenant_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_context_result JSONB;
    stats_config JSONB := '{}';
    user_role user_role;
    accessible_offices UUID[];
BEGIN
    -- Obter contexto do usuário
    SELECT get_user_full_context(user_uuid, tenant_uuid) INTO user_context_result;
    
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