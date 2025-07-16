
-- Índices para otimização de performance

-- Índices compostos para tabela sales (consultas mais frequentes)
CREATE INDEX IF NOT EXISTS idx_sales_tenant_status ON public.sales(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON public.sales(tenant_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_seller_date ON public.sales(seller_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_office_date ON public.sales(office_id, sale_date DESC);

-- Índices para tabela commissions
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_status ON public.commissions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_recipient ON public.commissions(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_commissions_due_date ON public.commissions(due_date);

-- Índices para tabela clients
CREATE INDEX IF NOT EXISTS idx_clients_tenant_status ON public.clients(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_responsible ON public.clients(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_office ON public.clients(office_id);

-- Índices para tabela tenant_users (relacionamentos frequentes)
CREATE INDEX IF NOT EXISTS idx_tenant_users_active ON public.tenant_users(tenant_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON public.tenant_users(tenant_id, role);

-- Índices para tabela profiles (buscas por nome e email)
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles USING gin(to_tsvector('portuguese', coalesce(full_name, '') || ' ' || coalesce(email, '')));

-- Índices para tabela offices
CREATE INDEX IF NOT EXISTS idx_offices_tenant_active ON public.offices(tenant_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_offices_type ON public.offices(tenant_id, type);

-- Índices para tabela teams
CREATE INDEX IF NOT EXISTS idx_teams_office ON public.teams(office_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_teams_leader ON public.teams(leader_id);

-- Índices para tabela permissions (sistema de permissões)
CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant_role ON public.role_permissions(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_user ON public.user_permissions(tenant_id, user_id);

-- Índices para audit_log (consultas por período e usuário)
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_date ON public.audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_date ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_action ON public.audit_log(table_name, action);

-- Comentários para documentação
COMMENT ON INDEX idx_sales_tenant_status IS 'Otimiza consultas de vendas por tenant e status';
COMMENT ON INDEX idx_sales_tenant_date IS 'Otimiza consultas de vendas por tenant ordenadas por data';
COMMENT ON INDEX idx_commissions_tenant_status IS 'Otimiza consultas de comissões por tenant e status';
COMMENT ON INDEX idx_profiles_search IS 'Otimiza busca textual em profiles usando full-text search';
