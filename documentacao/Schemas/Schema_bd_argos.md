
# Documentação do Schema do Banco de Dados - Argus360

## Visão Geral

O sistema Argus360 utiliza PostgreSQL com Supabase como banco de dados principal. O schema foi projetado seguindo o padrão multi-tenant, onde cada tenant (empresa/organização) possui seus próprios dados isolados através de Row Level Security (RLS).

## Estrutura Hierárquica

```
TENANTS (Empresas/Organizações)
├── USERS (Usuários vinculados via tenant_users)
├── OFFICES (Escritórios da empresa)
├── TEAMS (Equipes de trabalho)
├── CLIENTS (Clientes da empresa)
├── CONSORTIUM_PRODUCTS (Produtos de consórcio)
├── SALES (Vendas realizadas)
└── COMMISSIONS (Comissões calculadas)
```

## Tabelas Principais

### 1. tenants
**Função**: Representa as empresas/organizações que utilizam o sistema

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único do tenant |
| name | varchar | Não | - | Nome da empresa |
| slug | varchar | Não | - | Identificador único para URLs |
| status | enum | Sim | 'trial' | Status da assinatura |
| domain | varchar | Sim | - | Domínio personalizado |
| subscription_plan | enum | Sim | 'starter' | Plano de assinatura |
| subscription_starts_at | timestamp | Sim | now() | Início da assinatura |
| subscription_ends_at | timestamp | Sim | - | Fim da assinatura |
| max_users | integer | Sim | 5 | Limite de usuários |
| max_offices | integer | Sim | 1 | Limite de escritórios |
| max_storage_gb | integer | Sim | 1 | Limite de armazenamento |
| max_api_calls | integer | Sim | 1000 | Limite de chamadas API |
| settings | jsonb | Sim | '{}' | Configurações específicas |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

**Enums**:
- `tenant_status`: 'trial', 'active', 'suspended', 'cancelled'
- `subscription_plan`: 'starter', 'professional', 'enterprise'

### 2. profiles
**Função**: Perfis dos usuários do sistema (baseado em auth.users)

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | - | ID do usuário (FK para auth.users) |
| email | varchar | Não | - | Email do usuário |
| full_name | varchar | Sim | - | Nome completo |
| avatar_url | text | Sim | - | URL do avatar |
| phone | varchar | Sim | - | Telefone |
| department | varchar | Sim | - | Departamento |
| position | varchar | Sim | - | Cargo |
| department_id | uuid | Sim | - | FK para departments |
| position_id | uuid | Sim | - | FK para positions |
| hire_date | date | Sim | - | Data de contratação |
| hierarchical_level | integer | Sim | 1 | Nível hierárquico |
| last_access | timestamp | Sim | - | Último acesso |
| settings | jsonb | Sim | '{}' | Configurações do usuário |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

### 3. tenant_users
**Função**: Associa usuários aos tenants com suas respectivas funções

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| user_id | uuid | Não | - | FK para profiles |
| tenant_id | uuid | Não | - | FK para tenants |
| role | enum | Sim | 'user' | Função do usuário no tenant |
| active | boolean | Sim | true | Se o usuário está ativo |
| permissions | jsonb | Sim | '{}' | Permissões específicas |
| profile_id | uuid | Sim | - | FK para user_profiles |
| joined_at | timestamp | Sim | - | Data de entrada |
| invited_at | timestamp | Sim | now() | Data do convite |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

**Enum user_role**: 'owner', 'admin', 'manager', 'user', 'viewer'

### 4. offices
**Função**: Escritórios/filiais das empresas

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| name | varchar | Não | - | Nome do escritório |
| type | enum | Sim | 'matriz' | Tipo do escritório |
| parent_office_id | uuid | Sim | - | FK para offices (hierarquia) |
| responsible_id | uuid | Sim | - | Responsável pelo escritório |
| cnpj | varchar | Sim | - | CNPJ do escritório |
| address | jsonb | Sim | '{}' | Endereço completo |
| contact | jsonb | Sim | '{}' | Informações de contato |
| working_hours | jsonb | Sim | '{}' | Horários de funcionamento |
| settings | jsonb | Sim | '{}' | Configurações específicas |
| active | boolean | Sim | true | Se o escritório está ativo |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

**Enum office_type**: 'matriz', 'filial', 'representacao'

### 5. office_users
**Função**: Associa usuários aos escritórios específicos

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| user_id | uuid | Não | - | FK para profiles |
| office_id | uuid | Não | - | FK para offices |
| tenant_id | uuid | Não | - | FK para tenants |
| role | enum | Sim | 'user' | Função no escritório |
| active | boolean | Sim | true | Se a associação está ativa |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

### 6. clients
**Função**: Clientes das empresas

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | gen_random_uuid() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| office_id | uuid | Sim | - | FK para offices |
| responsible_user_id | uuid | Sim | - | Responsável pelo cliente |
| name | varchar | Não | - | Nome do cliente |
| document | varchar | Não | - | CPF/CNPJ |
| type | varchar | Não | - | Tipo (pessoa física/jurídica) |
| email | varchar | Sim | - | Email |
| phone | varchar | Sim | - | Telefone principal |
| secondary_phone | varchar | Sim | - | Telefone secundário |
| birth_date | date | Sim | - | Data de nascimento |
| address | jsonb | Sim | '{}' | Endereço completo |
| occupation | varchar | Sim | - | Profissão |
| monthly_income | numeric | Sim | - | Renda mensal |
| classification | varchar | Sim | 'cold' | Classificação do lead |
| status | varchar | Sim | 'prospect' | Status do cliente |
| source | varchar | Sim | - | Fonte de captação |
| notes | text | Sim | - | Observações |
| settings | jsonb | Sim | '{}' | Configurações específicas |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

### 7. consortium_products
**Função**: Produtos de consórcio oferecidos

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | gen_random_uuid() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| name | varchar | Não | - | Nome do produto |
| description | text | Sim | - | Descrição detalhada |
| category | varchar | Não | - | Categoria (auto, imóvel, etc) |
| asset_value | numeric | Não | - | Valor do bem |
| installments | integer | Não | - | Número de parcelas |
| monthly_fee | numeric | Não | - | Taxa mensal |
| administration_fee | numeric | Não | - | Taxa de administração |
| commission_rate | numeric | Não | - | Taxa de comissão |
| min_down_payment | numeric | Sim | 0 | Lance mínimo |
| status | varchar | Sim | 'active' | Status do produto |
| settings | jsonb | Sim | '{}' | Configurações específicas |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

### 8. sales
**Função**: Vendas realizadas

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | gen_random_uuid() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| office_id | uuid | Não | - | FK para offices |
| client_id | uuid | Não | - | FK para clients |
| product_id | uuid | Não | - | FK para consortium_products |
| seller_id | uuid | Não | - | FK para profiles |
| sale_value | numeric | Não | - | Valor da venda |
| down_payment | numeric | Sim | 0 | Valor de entrada |
| installments | integer | Não | - | Número de parcelas |
| monthly_payment | numeric | Não | - | Valor da parcela |
| commission_rate | numeric | Não | - | Taxa de comissão |
| commission_amount | numeric | Não | - | Valor da comissão |
| sale_date | date | Não | CURRENT_DATE | Data da venda |
| approval_date | date | Sim | - | Data de aprovação |
| completion_date | date | Sim | - | Data de finalização |
| cancellation_date | date | Sim | - | Data de cancelamento |
| contract_number | varchar | Sim | - | Número do contrato |
| status | varchar | Sim | 'pending' | Status da venda |
| notes | text | Sim | - | Observações |
| settings | jsonb | Sim | '{}' | Configurações específicas |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

### 9. commissions
**Função**: Comissões calculadas e pagamentos

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | gen_random_uuid() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| sale_id | uuid | Não | - | FK para sales |
| recipient_id | uuid | Não | - | ID do recebedor |
| recipient_type | varchar | Não | - | Tipo (seller, manager, etc) |
| base_amount | numeric | Não | - | Valor base para cálculo |
| commission_rate | numeric | Não | - | Taxa aplicada |
| commission_amount | numeric | Não | - | Valor da comissão |
| due_date | date | Não | - | Data de vencimento |
| approval_date | date | Sim | - | Data de aprovação |
| payment_date | date | Sim | - | Data de pagamento |
| payment_method | varchar | Sim | - | Método de pagamento |
| payment_reference | varchar | Sim | - | Referência do pagamento |
| status | varchar | Sim | 'pending' | Status da comissão |
| notes | text | Sim | - | Observações |
| settings | jsonb | Sim | '{}' | Configurações específicas |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

## Tabelas de Apoio

### departments
**Função**: Departamentos das empresas

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | gen_random_uuid() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| name | varchar | Não | - | Nome do departamento |
| description | text | Sim | - | Descrição |
| created_at | timestamp | Não | now() | Data de criação |
| updated_at | timestamp | Não | now() | Data de atualização |

### positions
**Função**: Cargos/posições nas empresas

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | gen_random_uuid() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| department_id | uuid | Sim | - | FK para departments |
| name | varchar | Não | - | Nome do cargo |
| description | text | Sim | - | Descrição |
| created_at | timestamp | Não | now() | Data de criação |
| updated_at | timestamp | Não | now() | Data de atualização |

### teams
**Função**: Equipes de trabalho

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| office_id | uuid | Não | - | FK para offices |
| name | varchar | Não | - | Nome da equipe |
| description | text | Sim | - | Descrição |
| leader_id | uuid | Sim | - | Líder da equipe |
| parent_team_id | uuid | Sim | - | Equipe pai (hierarquia) |
| goals | jsonb | Sim | '[]' | Metas da equipe |
| metrics | jsonb | Sim | '{}' | Métricas |
| settings | jsonb | Sim | '{}' | Configurações |
| active | boolean | Sim | true | Se a equipe está ativa |
| created_at | timestamp | Sim | now() | Data de criação |
| updated_at | timestamp | Sim | now() | Data de atualização |

### team_members
**Função**: Membros das equipes

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| team_id | uuid | Não | - | FK para teams |
| user_id | uuid | Não | - | FK para profiles |
| role | varchar | Sim | 'member' | Função na equipe |
| joined_at | timestamp | Sim | now() | Data de entrada |
| active | boolean | Sim | true | Se está ativo na equipe |

## Sistema de Permissões

### permissions
**Função**: Permissões disponíveis no sistema

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| module | varchar | Não | - | Módulo do sistema |
| resource | varchar | Não | - | Recurso específico |
| actions | varchar[] | Não | - | Ações permitidas |
| created_at | timestamp | Sim | now() | Data de criação |

### role_permissions
**Função**: Permissões por função

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| role | enum | Não | - | Função (user_role) |
| permission_id | uuid | Não | - | FK para permissions |
| created_at | timestamp | Sim | now() | Data de criação |

### user_permissions
**Função**: Permissões específicas por usuário

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| user_id | uuid | Não | - | FK para profiles |
| permission_id | uuid | Não | - | FK para permissions |
| granted_by | uuid | Sim | - | Quem concedeu |
| granted_at | timestamp | Sim | now() | Quando foi concedido |

### user_profiles
**Função**: Perfis de usuário personalizáveis

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | gen_random_uuid() | Identificador único |
| tenant_id | uuid | Não | - | FK para tenants |
| name | varchar | Não | - | Nome do perfil |
| description | text | Sim | - | Descrição |
| level | integer | Não | 1 | Nível de acesso |
| color | varchar | Não | '#3b82f6' | Cor do perfil |
| icon | varchar | Não | 'Users' | Ícone |
| is_custom | boolean | Não | true | Se é personalizado |
| permissions | jsonb | Sim | '[]' | Permissões específicas |
| created_at | timestamp | Não | now() | Data de criação |
| updated_at | timestamp | Não | now() | Data de atualização |

## Auditoria

### audit_log
**Função**: Log de auditoria do sistema

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | Não | uuid_generate_v4() | Identificador único |
| tenant_id | uuid | Sim | - | FK para tenants |
| user_id | uuid | Sim | - | FK para profiles |
| table_name | varchar | Sim | - | Tabela afetada |
| record_id | uuid | Sim | - | ID do registro |
| action | varchar | Não | - | Ação realizada |
| old_values | jsonb | Sim | - | Valores anteriores |
| new_values | jsonb | Sim | - | Novos valores |
| ip_address | inet | Sim | - | IP de origem |
| user_agent | text | Sim | - | User agent |
| created_at | timestamp | Sim | now() | Data da ação |

## Row Level Security (RLS)

Todas as tabelas principais possuem políticas RLS configuradas para garantir isolamento de dados entre tenants:

### Políticas Comuns:
1. **Visualização**: Usuários só podem ver dados de seu tenant
2. **Inserção**: Usuários só podem inserir dados em seu tenant
3. **Atualização**: Usuários só podem atualizar dados de seu tenant
4. **Exclusão**: Requer permissões específicas

### Funções de Segurança:
- `get_user_tenant_ids(uuid)`: Retorna IDs dos tenants do usuário
- `get_user_role_in_tenant(uuid, uuid)`: Retorna função do usuário no tenant
- `is_tenant_owner(uuid, uuid)`: Verifica se usuário é owner do tenant

## Relacionamentos Importantes

### Multi-Tenancy:
- Todos os dados são isolados por `tenant_id`
- Usuários são associados a tenants via `tenant_users`
- Escritórios pertencem a tenants específicos

### Hierarquias:
- **Escritórios**: `parent_office_id` para filiais
- **Equipes**: `parent_team_id` para sub-equipes
- **Usuários**: `hierarchical_level` para níveis organizacionais

### Fluxo de Vendas:
```
CLIENT → SALE → COMMISSION
    ↑      ↑         ↑
SELLER → PRODUCT → PAYMENT
```

## Índices Importantes

Para otimização de performance, os seguintes índices são recomendados:

```sql
-- Índices de tenant para isolamento
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_offices_tenant_id ON offices(tenant_id);

-- Índices compostos para consultas frequentes
CREATE INDEX idx_tenant_users_user_tenant ON tenant_users(user_id, tenant_id);
CREATE INDEX idx_office_users_user_office ON office_users(user_id, office_id);
CREATE INDEX idx_sales_seller_date ON sales(seller_id, sale_date);
CREATE INDEX idx_commissions_recipient_status ON commissions(recipient_id, status);
```

## Triggers e Funções

### Funções Principais:
- `create_initial_user_setup()`: Cria tenant e associações iniciais
- `add_user_to_tenant()`: Adiciona usuário a tenant existente
- `get_authenticated_user_data()`: Retorna dados completos do usuário
- `calculate_commission()`: Calcula valores de comissão

### Triggers:
- `handle_new_user()`: Cria perfil automaticamente
- `update_updated_at_column()`: Atualiza timestamps
- `create_automatic_commissions()`: Gera comissões automáticas

## Considerações de Backup e Manutenção

### Backup:
- Backup completo diário
- Backup incremental de 4 em 4 horas
- Retenção de 30 dias para backups

### Manutenção:
- Limpeza de audit_log > 2 anos
- Reindexação semanal
- Análise de estatísticas diária
- Vacuum automático configurado

## Migração e Versionamento

O sistema utiliza migrations do Supabase para controle de versão do schema. Cada alteração deve ser documentada e testada antes da aplicação em produção.

### Arquivos de Migration:
- Localização: `supabase/migrations/`
- Nomenclatura: `YYYYMMDDHHMMSS_description.sql`
- Controle: Git para versionamento
