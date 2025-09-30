# Matriz de Compatibilidade - Dashboard Personalizável

**Data:** 30/09/2025  
**Versão:** 2.0 (BREAKING CHANGES)  
**Autor:** Sistema Argos360

## 📊 Visão Geral

Este documento define a matriz completa de compatibilidade entre tipos de dados (Y-axis), agrupamentos (X-axis) e agregações para o dashboard personalizável.

**Total de Combinações:** 96 (4 × 4 × 6)
- **Y-axis (Tipos de Dados - Métricas):** 4 opções
- **X-axis (Agrupamentos - Dimensões):** 4 opções  
- **Agregações:** 6 opções

> **NOTA IMPORTANTE:** Produtos e Vendedores são DIMENSÕES de agrupamento (X-axis), não métricas (Y-axis)

---

## 🗂️ Tipos de Dados (Y-Axis) - Métricas

### 1. **Vendas (sales)**
- **Tabela:** `sales`
- **Campos Principais:** `sale_value`, `sale_date`, `seller_id`, `product_id`, `office_id`
- **Agregações Válidas:** `sum`, `count`, `avg`, `min`, `max`
- **Agrupamentos Compatíveis:**
  - ✅ **Tempo** - tem `sale_date`
  - ✅ **Produtos** - tem `product_id` (FK para `consortium_products`)
  - ✅ **Vendedores** - tem `seller_id` (FK para `profiles`)
  - ✅ **Escritórios** - tem `office_id` (FK para `offices`)

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

**IMPORTANTE:** A tabela `commissions` **NÃO possui foreign keys** para `recipient_id`. É necessário buscar dados em duas etapas:
1. Buscar comissões com `recipient_id` e `recipient_type`
2. Enriquecer com nomes de `profiles` ou `offices` em queries separadas

---

### 3. **Clientes (clients)**
- **Tabela:** `clients`
- **Campos Principais:** `name`, `created_at`, `responsible_user_id`, `office_id`
- **Agregações Válidas:** `count`, `count_distinct`
- **Agrupamentos Compatíveis:**
  - ✅ **Tempo** - tem `created_at`
  - ❌ **Produtos** - sem relacionamento direto
  - ✅ **Vendedores** - tem `responsible_user_id` (FK para `profiles`)
  - ✅ **Escritórios** - tem `office_id` (FK para `offices`)

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

---

## ✅ Matriz de Compatibilidade Completa

### 1. Vendas (sales) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos**      | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Vendedores**    | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios**   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |

**Combinações Válidas:** 20 de 24

---

### 2. Comissões (commissions) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos** ⚠️   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Vendedores** ⚠️ | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios** ⚠️| ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |

**Combinações Válidas:** 20 de 24  
⚠️ **Requer enriquecimento de dados** (sem FK direto)

---

### 3. Clientes (clients) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |
| **Produtos**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Vendedores**    | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |
| **Escritórios**   | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |

**Combinações Válidas:** 6 de 24

---

### 4. Metas (goals) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Vendedores**    | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios**   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |

**Combinações Válidas:** 15 de 24

---

## 📊 Resumo Estatístico

### Total de Combinações: 96

- ✅ **Combinações Válidas:** 61 (63.5%)
- ❌ **Combinações Inválidas:** 35 (36.5%)

### Por Tipo de Dado (Y-axis):

| Tipo        | Válidas | Inválidas | Taxa |
|-------------|---------|-----------|------|
| Vendas      | 20/24   | 4/24      | 83%  |
| Comissões   | 20/24   | 4/24      | 83%  |
| Clientes    | 6/24    | 18/24     | 25%  |
| Metas       | 15/24   | 9/24      | 63%  |

### Melhorias v2.0:
- **Redução de combinações inválidas:** De 81 para 35 (-57%)
- **Aumento na taxa de aproveitamento:** De 43.75% para 63.5% (+45%)
- **Eliminação de "furos":** Removidos sellers (8%) e products (0%) como Y-axis

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
