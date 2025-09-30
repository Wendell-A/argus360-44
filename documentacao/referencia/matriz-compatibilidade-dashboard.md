# Matriz de Compatibilidade - Dashboard Personalizável

**Data:** 30/09/2025  
**Versão:** 2.1 (Adição de Clientes como Dimensão)  
**Autor:** Sistema Argos360

## 📊 Visão Geral

Este documento define a matriz completa de compatibilidade entre tipos de dados (Y-axis), agrupamentos (X-axis) e agregações para o dashboard personalizável.

**Total de Combinações:** 120 (4 × 5 × 6)
- **Y-axis (Tipos de Dados - Métricas):** 4 opções
- **X-axis (Agrupamentos - Dimensões):** 5 opções  
- **Agregações:** 6 opções

> **NOTA IMPORTANTE:** Produtos, Vendedores e Clientes são DIMENSÕES de agrupamento (X-axis), não métricas (Y-axis)

---

## 🗂️ Tipos de Dados (Y-Axis) - Métricas

### 1. **Vendas (sales)**
- **Tabela:** `sales`
- **Campos Principais:** `sale_value`, `sale_date`, `seller_id`, `product_id`, `office_id`, `client_id`
- **Agregações Válidas:** `sum`, `count`, `avg`, `min`, `max`
- **Agrupamentos Compatíveis:**
  - ✅ **Tempo** - tem `sale_date`
  - ✅ **Produtos** - tem `product_id` (FK para `consortium_products`)
  - ✅ **Vendedores** - tem `seller_id` (FK para `profiles`)
  - ✅ **Escritórios** - tem `office_id` (FK para `offices`)
  - ✅ **Clientes** - tem `client_id` (FK para `clients`) - **NOVO**

---

### 2. **Comissões (commissions)**
- **Tabela:** `commissions`
- **Campos Principais:** `commission_amount`, `due_date`, `recipient_id`, `recipient_type`, `sale_id`
- **Agregações Válidas:** `sum`, `count`, `avg`, `min`, `max`
- **Agrupamentos Compatíveis:**
  - ✅ **Tempo** - tem `due_date`
  - ✅ **Produtos** - via `sale_id -> sales -> product_id` (JOIN indireto)
  - ✅ **Vendedores** - `recipient_id` quando `recipient_type = 'seller'` ⚠️ *Sem FK - enriquecimento necessário*
  - ✅ **Escritórios** - `recipient_id` quando `recipient_type = 'office'` ⚠️ *Sem FK - enriquecimento necessário*
  - ✅ **Clientes** - via `sale_id -> sales -> client_id` (JOIN indireto) - **NOVO**

**IMPORTANTE:** A tabela `commissions` **NÃO possui foreign keys** para `recipient_id`. É necessário buscar dados em duas etapas:
1. Buscar comissões com `recipient_id` e `recipient_type`
2. Enriquecer com nomes de `profiles` ou `offices` em queries separadas

---

### 3. **Novos Clientes (clients)** - RENOMEADO
- **Tabela:** `clients`
- **Campos Principais:** `name`, `created_at`, `responsible_user_id`, `office_id`
- **Agregações Válidas:** `count`, `count_distinct`
- **Agrupamentos Compatíveis:**
  - ✅ **Tempo** - tem `created_at` (data de aquisição)
  - ❌ **Produtos** - sem relacionamento direto
  - ✅ **Vendedores** - tem `responsible_user_id` (FK para `profiles`)
  - ✅ **Escritórios** - tem `office_id` (FK para `offices`)
  - ❌ **Clientes** - não faz sentido agrupar clientes por clientes

**NOTA:** Esta métrica representa a **aquisição de novos clientes** (contagem de registros na tabela `clients`). Para analisar o comportamento dos clientes existentes (vendas, comissões, etc.), use "Clientes" como dimensão de agrupamento (X-axis).

---

### 4. **Metas (goals)**
- **Tabela:** `goals`
- **Campos Principais:** `target_amount`, `current_amount`, `period_start`, `period_end`, `user_id`, `office_id`, `goal_type`
- **Agregações Válidas:** `sum`, `count`, `avg`, `min`, `max`
- **Agrupamentos Compatíveis:**
  - ✅ **Tempo** - tem `period_start` / `period_end`
  - ❌ **Produtos** - sem relacionamento direto
  - ✅ **Vendedores** - metas individuais têm `user_id` quando `goal_type = 'individual'`
  - ✅ **Escritórios** - metas de escritório têm `office_id` quando `goal_type = 'office'`

---

## 📈 Agregações

### Agregações Numéricas (Valores Monetários)
Aplicáveis a: `sales`, `commissions`, `goals`

- **`sum`** - Soma total dos valores
- **`avg`** - Média dos valores
- **`min`** - Valor mínimo
- **`max`** - Valor máximo
- **`count`** - Quantidade de registros

### Agregações de Contagem
Aplicáveis a: `clients`

- **`count`** - Quantidade total de registros
- **`count_distinct`** - Quantidade única (sem duplicatas)

---

## 🧭 Agrupamentos (X-Axis) - Dimensões

- **`time`** - Agrupamento temporal (por período de tempo)
- **`product`** - Agrupamento por produtos (`consortium_products`)
- **`seller`** - Agrupamento por vendedores (`tenant_users`/`profiles`)
- **`office`** - Agrupamento por escritórios (`offices`)
- **`clients`** - Agrupamento por clientes (`clients`) - **NOVO** - Permite análise de comportamento por cliente

---

## ✅ Matriz de Compatibilidade Completa

### 1. Vendas (sales) - 30 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos**      | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Vendedores**    | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios**   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Clientes** 🆕   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |

**Combinações Válidas:** 25 de 30

**Novos casos de uso habilitados:**
- 💰 Total vendido por cliente
- 📊 Número de vendas por cliente (frequência)
- 💵 Ticket médio por cliente
- 📈 Valor mínimo/máximo de venda por cliente

---

### 2. Comissões (commissions) - 30 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos** ⚠️   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Vendedores** ⚠️ | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios** ⚠️| ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Clientes** 🆕⚠️ | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |

**Combinações Válidas:** 25 de 30  
⚠️ **Requer enriquecimento de dados** (Clientes requer JOIN através de `sales`)

**Novos casos de uso habilitados:**
- 💰 Total de comissão gerada por cliente
- 📊 Número de comissões por cliente
- 💵 Comissão média por cliente

---

### 3. Novos Clientes (clients) - 30 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |
| **Produtos**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Vendedores**    | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |
| **Escritórios**   | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |
| **Clientes**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |

**Combinações Válidas:** 6 de 30

**Nota:** Esta métrica mede **aquisição de clientes**, não comportamento. Para análises de comportamento de clientes (vendas, comissões), use "Clientes" como X-axis.

---

### 4. Metas (goals) - 30 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Vendedores**    | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios**   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Clientes**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |

**Combinações Válidas:** 15 de 30

---

## 📊 Resumo Estatístico

### Total de Combinações: 120

- ✅ **Combinações Válidas:** 71 (59.2%)
- ❌ **Combinações Inválidas:** 49 (40.8%)

### Por Tipo de Dado (Y-axis):

| Tipo            | Válidas | Inválidas | Taxa  |
|-----------------|---------|-----------|-------|
| Vendas          | 25/30   | 5/30      | 83.3% |
| Comissões       | 25/30   | 5/30      | 83.3% |
| Novos Clientes  | 6/30    | 24/30     | 20.0% |
| Metas           | 15/30   | 15/30     | 50.0% |

### Melhorias v2.1:
- **Nova dimensão de análise:** Clientes como X-axis habilitado
- **Novos insights:** +10 combinações válidas (vendas e comissões por cliente)
- **Renomeação conceitual:** "Clientes" → "Novos Clientes" (Y-axis) para evitar confusão
- **Total de combinações:** 96 → 120 (+25%)
- **Taxa de aproveitamento:** 63.5% → 59.2% (ligeira redução esperada com mais opções)

### Impacto de Negócio:
- 🎯 **Visão 360º do cliente:** Agora é possível analisar vendas, comissões e comportamento por cliente
- 📊 **Análise de LTV:** Total vendido e comissões geradas por cliente ao longo do tempo
- 🔍 **Segmentação:** Identificar clientes mais valiosos vs. clientes inativos
- 💡 **Inteligência comercial:** Ticket médio, frequência de compra, e padrões por cliente

---

## ⚠️ Notas Técnicas

### 1. Comissões Sem Foreign Keys
A tabela `commissions` não possui FK para `recipient_id`. Soluções:

**Abordagem Atual (Enriquecimento em Duas Etapas):**
```typescript
// Etapa 1: Buscar comissões
const { data: commissions } = await supabase
  .from('commissions')
  .select('id, recipient_id, recipient_type, commission_amount')
  .eq('tenant_id', tenantId);

// Etapa 2: Enriquecer com nomes
const sellerIds = commissions.filter(c => c.recipient_type === 'seller')
  .map(c => c.recipient_id);

const { data: sellers } = await supabase
  .from('profiles')
  .select('id, full_name')
  .in('id', sellerIds);
```

**Alternativa (Futuro):** Adicionar FKs ao banco:
```sql
ALTER TABLE commissions
ADD CONSTRAINT fk_recipient_seller
FOREIGN KEY (recipient_id) REFERENCES profiles(id)
WHERE recipient_type = 'seller';
```

### 2. Performance de JOINs Indiretos
Combinações como "Comissões por Produto" exigem JOIN através de `sales`:
```
commissions -> sales -> consortium_products
```

Recomendação: Monitorar performance e adicionar índices se necessário.

---

## 🔍 Como Usar Esta Matriz

### Para Desenvolvedores:
1. Consultar matriz antes de adicionar nova combinação
2. Usar `src/lib/chartValidation.ts` para validar configurações
3. Exibir mensagens de erro amigáveis para combinações inválidas

### Para Usuários:
1. Interface deve desabilitar opções incompatíveis
2. Tooltips devem explicar por que combinação não é válida
3. Sugerir alternativas válidas quando possível

---

## 📝 Changelog

### v2.1 - 30/09/2025 (Clientes como Dimensão)
**Adição de Análise de Comportamento de Clientes**

**Mudanças:**
- ✅ Adicionado `clients` como tipo de X-axis (dimensão de agrupamento)
- ✅ Renomeado métrica Y-axis de "Clientes" para "Novos Clientes" (para evitar ambiguidade)
- ✅ Habilitadas 10 novas combinações válidas (vendas e comissões por cliente)
- ✅ Implementado processamento de dados `processClientData()` em `useDynamicChartData.ts`
- ✅ Atualizada validação em `chartValidation.ts` e `dashboardTestMatrix.ts`

**Impacto:**
- Total de combinações: 96 → 120 (+24 combinações)
- Combinações válidas: 61 → 71 (+10 combinações)
- Taxa de aproveitamento: 63.5% → 59.2% (redução esperada com mais opções)
- **Habilitação crítica:** Análise de comportamento de clientes (vendas, comissões, ticket médio por cliente)

**Motivo:**
A matriz anterior limitava severamente a análise de clientes ao tratá-los apenas como uma métrica de contagem (Y-axis). Esta atualização corrige isso ao habilitar "Clientes" como dimensão de agrupamento (X-axis), permitindo análises cruciais como:
- Total vendido por cliente (CLV - Customer Lifetime Value)
- Comissões geradas por cliente
- Ticket médio por cliente
- Frequência de compra por cliente

**Diferença conceitual:**
- **Y-axis "Novos Clientes"** = Contagem de aquisição (quantos clientes novos por período/vendedor/escritório)
- **X-axis "Clientes"** = Dimensão de análise (como os clientes existentes se comportam em vendas/comissões)

---

### v2.0 - 30/09/2025 (BREAKING CHANGES)
**Correção Conceitual da Matriz**

**Mudanças:**
- ❌ Removido `sellers` como tipo de Y-axis (dimensão, não métrica)
- ❌ Removido `products` como tipo de Y-axis (dimensão, não métrica)
- ✅ Mantidos apenas tipos de Y-axis que representam métricas: `sales`, `commissions`, `clients`, `goals`
- ✅ Produtos e Vendedores permanecem disponíveis como agrupamentos (X-axis)

**Impacto:**
- Total de combinações: 144 → 96 (-48 combinações)
- Combinações válidas: 63 → 61 (-2, ajuste fino)
- Taxa de aproveitamento: 43.75% → 63.5% (+45% de eficiência)
- Eliminados "furos" de dados com 0% e 8% de utilidade

**Motivo:**
A matriz anterior confundia tabelas de dimensão (produtos, vendedores) com tabelas de fatos (vendas, comissões). Esta correção alinha o modelo conceitual com o modelo dimensional correto: **Y-axis = Métricas (o que se mede)**, **X-axis = Dimensões (como se agrupa)**.

---

### v1.0 - 29/09/2025
- Versão inicial da matriz de compatibilidade
- Documentação completa de 144 combinações
- Identificação de bug crítico em `commissions.recipient_id`
- Implementação de validação centralizada

---

## 🔗 Arquivos Relacionados

- `src/lib/chartValidation.ts` - Validação centralizada
- `src/utils/dashboardTestMatrix.ts` - Sistema de testes
- `src/hooks/useDynamicChartData.ts` - Busca de dados para gráficos
- `src/hooks/useDynamicListData.ts` - Busca de dados para listas
- `documentacao/alteracoes/correcoes-dashboard-v4-29-09-2025.md` - Correções aplicadas
