
# Schema do Banco de Dados - Argus360

## Visão Geral

O banco de dados utiliza PostgreSQL com extensões UUID para identificadores únicos. Todas as tabelas possuem campos de auditoria (criação, atualização) e seguem padrões de nomenclatura consistentes.

## Tabelas Principais

### 1. planos_saas
**Função**: Gerencia os planos de assinatura do sistema SaaS

```sql
CREATE TABLE planos_saas (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() NOT NULL,
  codigo VARCHAR NOT NULL UNIQUE,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  valor_mensal NUMERIC DEFAULT 0.00,
  max_usuarios INTEGER DEFAULT 10,
  max_clientes INTEGER DEFAULT 1000,
  recursos_inclusos TEXT[],
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos Principais**:
- `codigo`: Identificador único do plano
- `valor_mensal`: Valor da mensalidade
- `max_usuarios`: Limite de usuários por escritório
- `max_clientes`: Limite de clientes por escritório
- `recursos_inclusos`: Array de recursos disponíveis

### 2. escritorios
**Função**: Representa os escritórios/empresas que usam o sistema

```sql
CREATE TABLE escritorios (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() NOT NULL,
  id_plano BIGINT NOT NULL REFERENCES planos_saas(id),
  razao_social VARCHAR NOT NULL,
  nome_fantasia VARCHAR NOT NULL,
  cnpj VARCHAR NOT NULL UNIQUE,
  email VARCHAR NOT NULL,
  telefone VARCHAR,
  endereco_completo TEXT,
  cep VARCHAR,
  cidade VARCHAR,
  estado VARCHAR,
  status VARCHAR DEFAULT 'trial',
  data_trial_fim DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  aceite_lgpd BOOLEAN DEFAULT false,
  data_aceite_lgpd TIMESTAMP WITH TIME ZONE,
  configuracoes JSONB DEFAULT '{}',
  -- Configurações de Segurança
  require_2fa BOOLEAN DEFAULT false,
  timeout_sessao_minutos INTEGER DEFAULT 480,
  max_tentativas_login INTEGER DEFAULT 5,
  ip_permitidos INET[],
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Status Possíveis**:
- `trial`: Período de teste
- `ativo`: Assinatura ativa
- `suspenso`: Temporariamente suspenso
- `cancelado`: Conta cancelada

### 3. perfis_acesso
**Função**: Define os níveis de acesso e permissões no sistema

```sql
CREATE TABLE perfis_acesso (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() NOT NULL,
  id_escritorio BIGINT NOT NULL REFERENCES escritorios(id),
  nome VARCHAR NOT NULL,
  descricao TEXT,
  nivel_acesso INTEGER DEFAULT 1,
  permissoes JSONB DEFAULT '{}',
  sistema BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Níveis de Acesso**:
- `10`: Super Admin (acesso total)
- `8`: Administrador (gestão do escritório)
- `5`: Gestor (gestão de vendas)
- `2`: Vendedor (operações básicas)
- `1`: Operacional (apenas leitura)

**Estrutura de Permissões (JSONB)**:
```json
{
  "usuarios": {"create": true, "read": true, "update": true, "delete": false},
  "clientes": {"create": true, "read": true, "update": true, "delete": true},
  "vendas": {"create": true, "read": true, "update": false, "delete": false},
  "relatorios": {"read": true},
  "configuracoes": {"read": true, "update": false}
}
```

### 4. usuarios
**Função**: Armazena os usuários do sistema

```sql
CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() NOT NULL,
  id_escritorio BIGINT NOT NULL REFERENCES escritorios(id),
  id_perfil_acesso BIGINT NOT NULL REFERENCES perfis_acesso(id),
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  email_verificado BOOLEAN DEFAULT false,
  deve_trocar_senha BOOLEAN DEFAULT true,
  -- Controle de Acesso
  tentativas_login INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP WITH TIME ZONE,
  ultimo_login TIMESTAMP WITH TIME ZONE,
  ultimo_ip INET,
  -- Two-Factor Authentication
  totp_ativo BOOLEAN DEFAULT false,
  totp_secret TEXT,
  configuracoes_usuario JSONB DEFAULT '{}',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Configurações do Usuário (JSONB)**:
```json
{
  "tema": "light",
  "idioma": "pt-BR",
  "timezone": "America/Sao_Paulo",
  "notificacoes": {
    "email": true,
    "push": false,
    "vendas": true,
    "comissoes": true
  }
}
```

### 5. auditoria_sistema
**Função**: Registra todas as operações importantes do sistema

```sql
CREATE TABLE auditoria_sistema (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() NOT NULL,
  id_escritorio BIGINT REFERENCES escritorios(id),
  id_usuario BIGINT REFERENCES usuarios(id),
  acao VARCHAR NOT NULL,
  tabela_afetada VARCHAR,
  registro_id BIGINT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  timestamp_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_origem INET,
  user_agent TEXT
);
```

**Tipos de Ação**:
- `INSERT`: Criação de registro
- `UPDATE`: Alteração de registro
- `DELETE`: Exclusão de registro
- `LOGIN`: Login no sistema
- `LOGOUT`: Logout do sistema

## Relacionamentos

### Hierarquia Principal
```
planos_saas (1:N) escritorios (1:N) usuarios
                              (1:N) perfis_acesso (1:N) usuarios
```

### Auditoria
```
escritorios ← auditoria_sistema → usuarios
```

## Índices Importantes

```sql
-- Performance de consultas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_escritorio ON usuarios(id_escritorio);
CREATE INDEX idx_auditoria_escritorio_data ON auditoria_sistema(id_escritorio, timestamp_acao);
CREATE INDEX idx_perfis_escritorio ON perfis_acesso(id_escritorio);

-- Índices compostos para consultas complexas
CREATE INDEX idx_usuarios_ativo_escritorio ON usuarios(ativo, id_escritorio);
CREATE INDEX idx_auditoria_tabela_acao ON auditoria_sistema(tabela_afetada, acao);
```

## Constraints e Validações

```sql
-- Email único por escritório
ALTER TABLE usuarios ADD CONSTRAINT uk_usuarios_email_escritorio 
  UNIQUE(email, id_escritorio);

-- CNPJ válido
ALTER TABLE escritorios ADD CONSTRAINT ck_escritorios_cnpj 
  CHECK(cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$');

-- Nível de acesso válido
ALTER TABLE perfis_acesso ADD CONSTRAINT ck_perfis_nivel 
  CHECK(nivel_acesso BETWEEN 1 AND 10);
```

## Triggers e Funções

### Atualização Automática de Timestamp
```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas as tabelas principais
CREATE TRIGGER trigger_update_timestamp_escritorios
    BEFORE UPDATE ON escritorios
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### Auditoria Automática
```sql
CREATE OR REPLACE FUNCTION trigger_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    -- Lógica de auditoria automática
    -- (implementada na documentação de funções)
END;
$$ LANGUAGE plpgsql;
```

## Row Level Security (RLS)

### Políticas Básicas
```sql
-- Usuários só veem dados do próprio escritório
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuarios_escritorio_policy ON usuarios
  FOR ALL TO authenticated
  USING (id_escritorio = get_user_escritorio_id());
```

## Extensões Utilizadas

```sql
-- UUID para identificadores únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Funções de texto avançadas
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Criptografia adicional
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Backup e Manutenção

### Scripts de Backup
```sql
-- Backup completo
pg_dump -h localhost -U postgres -d argus360 > backup_$(date +%Y%m%d).sql

-- Backup apenas dados
pg_dump -h localhost -U postgres -d argus360 --data-only > dados_$(date +%Y%m%d).sql
```

### Manutenção Periódica
```sql
-- Limpeza de auditoria antiga (> 2 anos)
DELETE FROM auditoria_sistema 
WHERE timestamp_acao < NOW() - INTERVAL '2 years';

-- Reindexação
REINDEX DATABASE argus360;

-- Análise de estatísticas
ANALYZE;
```
