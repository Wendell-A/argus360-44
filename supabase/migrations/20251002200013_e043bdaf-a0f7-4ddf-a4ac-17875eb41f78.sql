
-- =====================================================
-- FASE 2: OTIMIZAÇÃO DE QUERIES E ÍNDICES (Corrigido)
-- Data: 02 de Outubro de 2025
-- Objetivo: Criar índices para melhorar performance
-- =====================================================

-- ===================================================
-- PARTE 0: HABILITAR EXTENSÕES NECESSÁRIAS
-- ===================================================

-- Habilitar pg_trgm para busca full-text com trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ===================================================
-- PARTE 1: ÍNDICES PARA FOREIGN KEYS SEM ÍNDICE
-- ===================================================

-- Tabela: automated_tasks
CREATE INDEX IF NOT EXISTS idx_automated_tasks_client_id 
ON public.automated_tasks(client_id);

CREATE INDEX IF NOT EXISTS idx_automated_tasks_template_id 
ON public.automated_tasks(template_id);

CREATE INDEX IF NOT EXISTS idx_automated_tasks_trigger_stage_id 
ON public.automated_tasks(trigger_stage_id);

-- Tabela: client_funnel_position
CREATE INDEX IF NOT EXISTS idx_client_funnel_position_stage_id 
ON public.client_funnel_position(stage_id);

CREATE INDEX IF NOT EXISTS idx_client_funnel_position_tenant_id 
ON public.client_funnel_position(tenant_id);

-- Tabela: client_interactions
CREATE INDEX IF NOT EXISTS idx_client_interactions_tenant_id 
ON public.client_interactions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_client_interactions_seller_id 
ON public.client_interactions(seller_id);

-- Tabela: commission_payment_schedules
CREATE INDEX IF NOT EXISTS idx_commission_payment_schedules_tenant_id 
ON public.commission_payment_schedules(tenant_id);

CREATE INDEX IF NOT EXISTS idx_commission_payment_schedules_product_id 
ON public.commission_payment_schedules(product_id);

-- Tabela: commissions
CREATE INDEX IF NOT EXISTS idx_commissions_parent_commission_id 
ON public.commissions(parent_commission_id) 
WHERE parent_commission_id IS NOT NULL;

-- Tabela: dashboard_configurations
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_tenant_id 
ON public.dashboard_configurations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_user_id 
ON public.dashboard_configurations(user_id) 
WHERE user_id IS NOT NULL;

-- Tabela: defaulters
CREATE INDEX IF NOT EXISTS idx_defaulters_sale_id 
ON public.defaulters(sale_id) 
WHERE sale_id IS NOT NULL;

-- Tabela: goals
CREATE INDEX IF NOT EXISTS idx_goals_user_id 
ON public.goals(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_goals_office_id 
ON public.goals(office_id) 
WHERE office_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_goals_created_by 
ON public.goals(created_by) 
WHERE created_by IS NOT NULL;

-- Tabela: invitations
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id 
ON public.invitations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_invitations_invited_by 
ON public.invitations(invited_by);

-- Tabela: message_templates
CREATE INDEX IF NOT EXISTS idx_message_templates_tenant_id 
ON public.message_templates(tenant_id);

CREATE INDEX IF NOT EXISTS idx_message_templates_stage_id 
ON public.message_templates(stage_id) 
WHERE stage_id IS NOT NULL;

-- Tabela: office_users
CREATE INDEX IF NOT EXISTS idx_office_users_tenant_id 
ON public.office_users(tenant_id);

CREATE INDEX IF NOT EXISTS idx_office_users_office_id 
ON public.office_users(office_id);

CREATE INDEX IF NOT EXISTS idx_office_users_user_id 
ON public.office_users(user_id);

-- Tabela: offices
CREATE INDEX IF NOT EXISTS idx_offices_parent_office_id 
ON public.offices(parent_office_id) 
WHERE parent_office_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_offices_responsible_id 
ON public.offices(responsible_id) 
WHERE responsible_id IS NOT NULL;

-- Tabela: permission_contexts
CREATE INDEX IF NOT EXISTS idx_permission_contexts_tenant_id 
ON public.permission_contexts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_permission_contexts_user_id 
ON public.permission_contexts(user_id);

CREATE INDEX IF NOT EXISTS idx_permission_contexts_granted_by 
ON public.permission_contexts(granted_by) 
WHERE granted_by IS NOT NULL;

-- Tabela: positions
CREATE INDEX IF NOT EXISTS idx_positions_tenant_id 
ON public.positions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_positions_department_id 
ON public.positions(department_id) 
WHERE department_id IS NOT NULL;

-- Tabela: product_chargeback_schedules
CREATE INDEX IF NOT EXISTS idx_product_chargeback_schedules_tenant_id 
ON public.product_chargeback_schedules(tenant_id);

CREATE INDEX IF NOT EXISTS idx_product_chargeback_schedules_product_id 
ON public.product_chargeback_schedules(product_id);

-- Tabela: profiles
CREATE INDEX IF NOT EXISTS idx_profiles_department_id 
ON public.profiles(department_id) 
WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_position_id 
ON public.profiles(position_id) 
WHERE position_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);


-- ===================================================
-- PARTE 2: ÍNDICES COMPOSTOS PARA QUERIES FREQUENTES
-- ===================================================

-- Sales: queries por tenant + status + date
CREATE INDEX IF NOT EXISTS idx_sales_tenant_status_date 
ON public.sales(tenant_id, status, sale_date DESC);

-- Sales: queries por seller + status
CREATE INDEX IF NOT EXISTS idx_sales_seller_status 
ON public.sales(seller_id, status, sale_date DESC);

-- Sales: queries por office + status
CREATE INDEX IF NOT EXISTS idx_sales_office_status 
ON public.sales(office_id, status, sale_date DESC);

-- Commissions: queries por recipient + status
CREATE INDEX IF NOT EXISTS idx_commissions_recipient_status 
ON public.commissions(recipient_id, recipient_type, status, due_date);

-- Commissions: queries por tenant + status + due_date
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_status_due 
ON public.commissions(tenant_id, status, due_date);

-- Client interactions: queries por seller + status
CREATE INDEX IF NOT EXISTS idx_client_interactions_seller_status 
ON public.client_interactions(seller_id, status, scheduled_at DESC);

-- Client interactions: queries por tenant + status
CREATE INDEX IF NOT EXISTS idx_client_interactions_tenant_status 
ON public.client_interactions(tenant_id, status, created_at DESC);

-- Goals: queries por tenant + status + period
CREATE INDEX IF NOT EXISTS idx_goals_tenant_status_period 
ON public.goals(tenant_id, status, period_start, period_end);

-- Goals: queries por tenant + type + status
CREATE INDEX IF NOT EXISTS idx_goals_tenant_type_status 
ON public.goals(tenant_id, goal_type, status);

-- Clients: queries por tenant + status + responsible
CREATE INDEX IF NOT EXISTS idx_clients_tenant_status_responsible 
ON public.clients(tenant_id, status, responsible_user_id);

-- Clients: queries por tenant + classification
CREATE INDEX IF NOT EXISTS idx_clients_tenant_classification 
ON public.clients(tenant_id, classification, created_at DESC);

-- Automated tasks: queries por tenant + status + due_date
CREATE INDEX IF NOT EXISTS idx_automated_tasks_tenant_status_due 
ON public.automated_tasks(tenant_id, status, due_date);

-- Notifications: queries por user + is_read
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications(user_id, is_read, created_at DESC);

-- Tenant users: queries por tenant + active + role
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_active_role 
ON public.tenant_users(tenant_id, active, role);

-- Office users: queries por tenant + office + active
CREATE INDEX IF NOT EXISTS idx_office_users_tenant_office_active 
ON public.office_users(tenant_id, office_id, active);


-- ===================================================
-- PARTE 3: ÍNDICES PARA OTIMIZAÇÃO DE RLS POLICIES
-- ===================================================

-- Audit log: otimizar policy de visualização por tenant
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_user_created 
ON public.audit_log(tenant_id, user_id, created_at DESC);

-- Clients: otimizar policy por tenant + office + responsible
CREATE INDEX IF NOT EXISTS idx_clients_rls_context 
ON public.clients(tenant_id, office_id, responsible_user_id);

-- Sales: otimizar policy por tenant + seller + office
CREATE INDEX IF NOT EXISTS idx_sales_rls_context 
ON public.sales(tenant_id, seller_id, office_id, status);

-- Client funnel position: otimizar policy
CREATE INDEX IF NOT EXISTS idx_client_funnel_position_rls 
ON public.client_funnel_position(tenant_id, client_id, is_current);


-- ===================================================
-- PARTE 4: ÍNDICES PARA BUSCA FULL-TEXT
-- ===================================================

-- Clients: busca por nome (usando trigram para LIKE queries)
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm 
ON public.clients USING gin (name gin_trgm_ops);

-- Profiles: busca por nome
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm 
ON public.profiles USING gin (full_name gin_trgm_ops);


-- ===================================================
-- ANÁLISE E COMENTÁRIOS
-- ===================================================

COMMENT ON INDEX idx_sales_tenant_status_date IS 
'Otimiza queries do dashboard e relatórios de vendas por tenant e status';

COMMENT ON INDEX idx_commissions_recipient_status IS 
'Otimiza queries de comissões por vendedor/escritório com filtro de status';

COMMENT ON INDEX idx_clients_tenant_status_responsible IS 
'Otimiza queries de clientes com filtros combinados de tenant, status e responsável';

COMMENT ON INDEX idx_goals_tenant_type_status IS 
'Otimiza queries de metas por tipo (individual/office) e status';

COMMENT ON INDEX idx_notifications_user_read IS 
'Otimiza queries de notificações não lidas por usuário';

COMMENT ON INDEX idx_clients_name_trgm IS 
'Índice GIN com trigram para busca eficiente de clientes por nome usando LIKE/ILIKE';

COMMENT ON INDEX idx_profiles_full_name_trgm IS 
'Índice GIN com trigram para busca eficiente de perfis por nome usando LIKE/ILIKE';
