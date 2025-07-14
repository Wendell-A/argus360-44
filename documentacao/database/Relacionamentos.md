
# Relacionamentos do Banco de Dados

## Diagrama de Relacionamentos (Textual)

```
┌─────────────────┐     1:N     ┌─────────────────┐
│   planos_saas   │────────────→│   escritorios   │
│                 │             │                 │
│ • id (PK)       │             │ • id (PK)       │
│ • codigo        │             │ • id_plano (FK) │
│ • nome          │             │ • razao_social  │
│ • valor_mensal  │             │ • cnpj          │
└─────────────────┘             └─────────────────┘
                                        │
                                        │ 1:N
                                        ▼
                                ┌─────────────────┐
                                │ perfis_acesso   │
                                │                 │
                                │ • id (PK)       │
                                │ • id_escritorio │
                                │ • nome          │
                                │ • nivel_acesso  │
                                │ • permissoes    │
                                └─────────────────┘
                                        │
                                        │ 1:N
                                        ▼
                ┌─────────────────┐     N:1     ┌─────────────────┐
                │    usuarios     │────────────→│ perfis_acesso   │
                │                 │             │                 │
                │ • id (PK)       │             │ • id (PK)       │
                │ • id_escritorio │←───────────┐│ • id_escritorio │
                │ • id_perfil     │            ││ • nome          │
                │ • nome          │            │└─────────────────┘
                │ • email         │            │
                └─────────────────┘            │
                        │                      │
                        │ 1:N                  │ N:1
                        ▼                      │
                ┌─────────────────┐            │
                │auditoria_sistema│            │
                │                 │            │
                │ • id (PK)       │            │
                │ • id_usuario    │────────────┘
                │ • id_escritorio │────────────┐
                │ • acao          │            │
                │ • tabela_afetada│            │
                │ • dados_novos   │            │
                └─────────────────┘            │
                                               │
                        ┌─────────────────┐    │
                        │   escritorios   │←───┘
                        │                 │
                        │ • id (PK)       │
                        └─────────────────┘
```

## Relacionamentos Detalhados

### 1. planos_saas → escritorios (1:N)
**Relacionamento**: Um plano pode ter vários escritórios, mas cada escritório tem apenas um plano.

```sql
ALTER TABLE escritorios 
ADD CONSTRAINT fk_escritorios_plano 
FOREIGN KEY (id_plano) REFERENCES planos_saas(id);
```

**Regras de Negócio**:
- Escritório não pode ser criado sem plano
- Mudança de plano deve respeitar limites de usuários/clientes
- Plano inativo impede criação de novos escritórios

### 2. escritorios → perfis_acesso (1:N)
**Relacionamento**: Um escritório pode ter vários perfis de acesso.

```sql
ALTER TABLE perfis_acesso 
ADD CONSTRAINT fk_perfis_escritorio 
FOREIGN KEY (id_escritorio) REFERENCES escritorios(id);
```

**Regras de Negócio**:
- Perfis são criados automaticamente para novos escritórios
- Perfis sistema não podem ser excluídos
- Cada escritório tem perfis isolados

### 3. escritorios → usuarios (1:N)
**Relacionamento**: Um escritório pode ter vários usuários.

```sql
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_escritorio 
FOREIGN KEY (id_escritorio) REFERENCES escritorios(id);
```

**Regras de Negócio**:
- Usuário pertence a apenas um escritório
- Limite de usuários definido pelo plano
- Isolamento total entre escritórios

### 4. perfis_acesso → usuarios (1:N)
**Relacionamento**: Um perfil pode ser atribuído a vários usuários.

```sql
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_perfil 
FOREIGN KEY (id_perfil_acesso) REFERENCES perfis_acesso(id);
```

**Regras de Negócio**:
- Usuário deve ter um perfil obrigatoriamente
- Perfil deve ser do mesmo escritório do usuário
- Mudança de perfil altera permissões imediatamente

### 5. usuarios → auditoria_sistema (1:N)
**Relacionamento**: Um usuário pode ter vários registros de auditoria.

```sql
ALTER TABLE auditoria_sistema 
ADD CONSTRAINT fk_auditoria_usuario 
FOREIGN KEY (id_usuario) REFERENCES usuarios(id);
```

**Regras de Negócio**:
- Auditoria pode existir sem usuário (ações do sistema)
- Registro preservado mesmo se usuário for excluído
- Rastreabilidade completa de ações

### 6. escritorios → auditoria_sistema (1:N)
**Relacionamento**: Um escritório pode ter vários registros de auditoria.

```sql
ALTER TABLE auditoria_sistema 
ADD CONSTRAINT fk_auditoria_escritorio 
FOREIGN KEY (id_escritorio) REFERENCES escritorios(id);
```

**Regras de Negócio**:
- Todas as ações são associadas a um escritório
- Isolamento de auditoria por escritório
- Histórico preservado indefinidamente

## Constraints de Integridade

### Chaves Únicas Compostas
```sql
-- Email único por escritório
ALTER TABLE usuarios 
ADD CONSTRAINT uk_usuarios_email_escritorio 
UNIQUE(email, id_escritorio);

-- Nome do perfil único por escritório
ALTER TABLE perfis_acesso 
ADD CONSTRAINT uk_perfis_nome_escritorio 
UNIQUE(nome, id_escritorio);
```

### Validações de Referência
```sql
-- Perfil deve ser do mesmo escritório do usuário
ALTER TABLE usuarios 
ADD CONSTRAINT ck_usuarios_perfil_escritorio 
CHECK(
  (SELECT id_escritorio FROM perfis_acesso 
   WHERE id = id_perfil_acesso) = id_escritorio
);
```

## Relacionamentos Futuros (Expansão)

### Módulo de Consórcios
```
escritorios (1:N) → consorcios_tabelas
consorcios_tabelas (1:N) → consorcios_cotas
usuarios (1:N) → vendas
vendas (N:1) → consorcios_cotas
vendas (1:N) → comissoes
```

### Módulo de Clientes
```
escritorios (1:N) → clientes
usuarios (1:N) → clientes (vendedor responsável)
clientes (1:N) → vendas
```

## Políticas de Cascata

### Deleção Cascata
```sql
-- Excluir escritório remove todos os dados relacionados
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_escritorio 
FOREIGN KEY (id_escritorio) REFERENCES escritorios(id) 
ON DELETE CASCADE;

ALTER TABLE perfis_acesso 
ADD CONSTRAINT fk_perfis_escritorio 
FOREIGN KEY (id_escritorio) REFERENCES escritorios(id) 
ON DELETE CASCADE;
```

### Atualização Cascata
```sql
-- Mudança de plano atualiza referências
ALTER TABLE escritorios 
ADD CONSTRAINT fk_escritorios_plano 
FOREIGN KEY (id_plano) REFERENCES planos_saas(id) 
ON UPDATE CASCADE;
```

## Views para Consultas Complexas

### Usuários com Perfis
```sql
CREATE VIEW vw_usuarios_completos AS
SELECT 
  u.id,
  u.nome,
  u.email,
  u.ativo,
  e.nome_fantasia as escritorio,
  p.nome as perfil,
  p.nivel_acesso
FROM usuarios u
JOIN escritorios e ON u.id_escritorio = e.id
JOIN perfis_acesso p ON u.id_perfil_acesso = p.id;
```

### Escritórios com Planos
```sql
CREATE VIEW vw_escritorios_planos AS
SELECT 
  e.id,
  e.nome_fantasia,
  e.status,
  p.nome as plano,
  p.valor_mensal,
  p.max_usuarios,
  (SELECT COUNT(*) FROM usuarios WHERE id_escritorio = e.id AND ativo = true) as usuarios_ativos
FROM escritorios e
JOIN planos_saas p ON e.id_plano = p.id;
```

## Performance e Índices

### Índices de Relacionamento
```sql
-- Consultas frequentes por escritório
CREATE INDEX idx_usuarios_escritorio ON usuarios(id_escritorio);
CREATE INDEX idx_perfis_escritorio ON perfis_acesso(id_escritorio);
CREATE INDEX idx_auditoria_escritorio ON auditoria_sistema(id_escritorio);

-- Consultas por perfil
CREATE INDEX idx_usuarios_perfil ON usuarios(id_perfil_acesso);

-- Consultas de auditoria
CREATE INDEX idx_auditoria_usuario_data ON auditoria_sistema(id_usuario, timestamp_acao);
```

### Estatísticas de Relacionamentos
```sql
-- Análise de distribuição
SELECT 
  p.nome as plano,
  COUNT(e.id) as escritorios,
  AVG((SELECT COUNT(*) FROM usuarios WHERE id_escritorio = e.id)) as media_usuarios
FROM planos_saas p
LEFT JOIN escritorios e ON p.id = e.id_plano
GROUP BY p.id, p.nome;
```
