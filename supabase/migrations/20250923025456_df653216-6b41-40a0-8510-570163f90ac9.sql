-- ETAPA 1: Correção e Alinhamento de Dados Base
-- Migração segura para alinhar nomenclatura frontend/backend

-- 1. Backup das permissões atuais (inserir novos registros com nomenclatura correta)
INSERT INTO permissions (id, module, resource, actions, created_at) VALUES

-- System permissions (sistema/configurações)
('550e8400-e29b-41d4-a716-446655440001', 'system', 'permissions', ARRAY['read', 'write', 'create', 'delete'], now()),
('550e8400-e29b-41d4-a716-446655440002', 'system', 'settings', ARRAY['read', 'write'], now()),
('550e8400-e29b-41d4-a716-446655440003', 'system', 'audit', ARRAY['read'], now()),

-- Users permissions (usuarios)
('550e8400-e29b-41d4-a716-446655440004', 'users', 'management', ARRAY['create', 'read', 'update', 'delete'], now()),
('550e8400-e29b-41d4-a716-446655440005', 'users', 'invitations', ARRAY['create', 'read', 'update', 'delete'], now()),
('550e8400-e29b-41d4-a716-446655440006', 'users', 'roles', ARRAY['read', 'write'], now()),

-- Sales permissions (vendas)
('550e8400-e29b-41d4-a716-446655440007', 'sales', 'management', ARRAY['create', 'read', 'update', 'delete'], now()),
('550e8400-e29b-41d4-a716-446655440008', 'sales', 'approval', ARRAY['write'], now()),
('550e8400-e29b-41d4-a716-446655440009', 'sales', 'view', ARRAY['read'], now()),

-- Clients permissions (clientes)
('550e8400-e29b-41d4-a716-446655440010', 'clients', 'management', ARRAY['create', 'read', 'update', 'delete'], now()),
('550e8400-e29b-41d4-a716-446655440011', 'clients', 'interactions', ARRAY['create', 'read', 'update'], now()),

-- Reports permissions (relatórios)
('550e8400-e29b-41d4-a716-446655440012', 'reports', 'view', ARRAY['read'], now()),
('550e8400-e29b-41d4-a716-446655440013', 'reports', 'export', ARRAY['create'], now()),

-- Offices permissions (escritórios)
('550e8400-e29b-41d4-a716-446655440014', 'offices', 'management', ARRAY['create', 'read', 'update', 'delete'], now()),

-- Commissions permissions (comissões)
('550e8400-e29b-41d4-a716-446655440015', 'commissions', 'management', ARRAY['create', 'read', 'update', 'write'], now());

-- 2. Criar mapeamento de compatibilidade para role_permissions
-- Migrar role_permissions existentes para usar as novas permissões
CREATE TEMP TABLE permission_mapping AS
SELECT 
  old_p.id as old_id,
  new_p.id as new_id,
  old_p.module as old_module,
  new_p.module as new_module,
  old_p.resource as old_resource,
  new_p.resource as new_resource
FROM permissions old_p
JOIN permissions new_p ON (
  (old_p.module = 'usuarios' AND new_p.module = 'users' AND old_p.resource = 'all' AND new_p.resource = 'management') OR
  (old_p.module = 'usuarios' AND new_p.module = 'users' AND old_p.resource = 'team' AND new_p.resource = 'management') OR
  (old_p.module = 'clientes' AND new_p.module = 'clients' AND old_p.resource = 'all' AND new_p.resource = 'management') OR
  (old_p.module = 'clientes' AND new_p.module = 'clients' AND old_p.resource = 'team' AND new_p.resource = 'management') OR
  (old_p.module = 'comissoes' AND new_p.module = 'commissions' AND old_p.resource = 'all' AND new_p.resource = 'management') OR
  (old_p.module = 'relatorios' AND new_p.module = 'reports' AND old_p.resource = 'all' AND new_p.resource = 'view') OR
  (old_p.module = 'configuracoes' AND new_p.module = 'system' AND old_p.resource = 'all' AND new_p.resource = 'settings')
)
WHERE old_p.id != new_p.id;

-- 3. Migrar role_permissions para usar novas permissões
INSERT INTO role_permissions (role, tenant_id, permission_id, created_at)
SELECT DISTINCT
  rp.role,
  rp.tenant_id,
  pm.new_id,
  now()
FROM role_permissions rp
JOIN permission_mapping pm ON pm.old_id = rp.permission_id
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.role = rp.role 
    AND rp2.tenant_id = rp.tenant_id 
    AND rp2.permission_id = pm.new_id
);

-- 4. Função para verificar se migração está completa
CREATE OR REPLACE FUNCTION check_permission_migration()
RETURNS TABLE(
  old_permissions_count bigint,
  new_permissions_count bigint,
  migrated_role_permissions bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM permissions WHERE module IN ('usuarios', 'clientes', 'comissoes', 'relatorios', 'configuracoes')) as old_permissions_count,
    (SELECT COUNT(*) FROM permissions WHERE module IN ('users', 'clients', 'commissions', 'reports', 'system', 'sales', 'offices')) as new_permissions_count,
    (SELECT COUNT(*) FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.module IN ('users', 'clients', 'commissions', 'reports', 'system', 'sales', 'offices')) as migrated_role_permissions;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar migração
SELECT * FROM check_permission_migration();