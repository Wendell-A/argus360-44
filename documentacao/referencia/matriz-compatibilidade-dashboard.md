# Matriz de Compatibilidade - Dashboard Personalizável

**Data:** 29/09/2025  
**Versão:** 1.0  
**Autor:** Sistema Argos360

## 📊 Visão Geral

Este documento define a matriz completa de compatibilidade entre tipos de dados (Y-axis), agrupamentos (X-axis) e agregações para o dashboard personalizável.

**Total de Combinações:** 144 (6 × 4 × 6)
- **Y-axis (Tipos de Dados):** 6 opções
- **X-axis (Agrupamentos):** 4 opções  
- **Agregações:** 6 opções

---

## 🗂️ Tipos de Dados (Y-Axis)

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

### 4. **Vendedores (sellers)**
- **Tabela:** `tenant_users` (JOIN com `profiles`)
- **Campos Principais:** `user_id`, `office_id`, `role`
- **Agregações Válidas:** `count`, `count_distinct`
- **Agrupamentos Compatíveis:**
  - ❌ **Tempo** - não tem campo de data significativo
  - ❌ **Produtos** - sem relacionamento direto
  - ❌ **Vendedores** - não faz sentido agrupar vendedores por vendedores
  - ✅ **Escritórios** - tem `office_id` (FK para `offices`)

---

### 5. **Metas (goals)**
- **Tabela:** `goals`
- **Campos Principais:** `target_amount`, `current_amount`, `period_start`, `period_end`, `user_id`, `office_id`, `goal_type`
- **Agregações Válidas:** `sum`, `count`, `avg`, `min`, `max`
- **Agrupamentos Compatíveis:**
  - ✅ **Tempo** - tem `period_start` / `period_end`
  - ❌ **Produtos** - sem relacionamento direto
  - ✅ **Vendedores** - metas individuais têm `user_id` quando `goal_type = 'individual'`
  - ✅ **Escritórios** - metas de escritório têm `office_id` quando `goal_type = 'office'`

---

### 6. **Produtos (products)**
- **Tabela:** `consortium_products`
- **Campos Principais:** `name`, `commission_rate`, `product_type`
- **Agregações Válidas:** `count`, `count_distinct`
- **Agrupamentos Compatíveis:**
  - ❌ **Tempo** - não tem campo de data significativo
  - ❌ **Produtos** - não faz sentido agrupar produtos por produtos
  - ❌ **Vendedores** - sem relacionamento direto
  - ❌ **Escritórios** - sem relacionamento direto

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
Aplicáveis a: `clients`, `sellers`, `products`

- **`count`** - Quantidade total de registros
- **`count_distinct`** - Quantidade única (sem duplicatas)

---

## ✅ Matriz de Compatibilidade Completa

### Vendas (sales) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos**      | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Vendedores**    | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios**   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |

**Combinações Válidas:** 20 de 24

---

### Comissões (commissions) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos** ⚠️   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Vendedores** ⚠️ | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios** ⚠️| ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |

**Combinações Válidas:** 20 de 24  
⚠️ **Requer enriquecimento de dados** (sem FK direto)

---

### Clientes (clients) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |
| **Produtos**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Vendedores**    | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |
| **Escritórios**   | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |

**Combinações Válidas:** 6 de 24

---

### Vendedores (sellers) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Produtos**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Vendedores**    | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Escritórios**   | ❌  | ✅    | ❌  | ❌  | ❌  | ✅             |

**Combinações Válidas:** 2 de 24

---

### Metas (goals) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Produtos**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Vendedores**    | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |
| **Escritórios**   | ✅  | ✅    | ✅  | ✅  | ✅  | ❌             |

**Combinações Válidas:** 15 de 24

---

### Produtos (products) - 24 combinações

| X-Axis \ Agregação | sum | count | avg | min | max | count_distinct |
|-------------------|-----|-------|-----|-----|-----|----------------|
| **Tempo**         | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Produtos**      | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Vendedores**    | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |
| **Escritórios**   | ❌  | ❌    | ❌  | ❌  | ❌  | ❌             |

**Combinações Válidas:** 0 de 24

---

## 📊 Resumo Estatístico

### Total de Combinações: 144

- ✅ **Combinações Válidas:** 63 (43.75%)
- ❌ **Combinações Inválidas:** 81 (56.25%)

### Por Tipo de Dado:

| Tipo        | Válidas | Inválidas | Taxa |
|-------------|---------|-----------|------|
| Vendas      | 20/24   | 4/24      | 83%  |
| Comissões   | 20/24   | 4/24      | 83%  |
| Clientes    | 6/24    | 18/24     | 25%  |
| Vendedores  | 2/24    | 22/24     | 8%   |
| Metas       | 15/24   | 9/24      | 63%  |
| Produtos    | 0/24    | 24/24     | 0%   |

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
