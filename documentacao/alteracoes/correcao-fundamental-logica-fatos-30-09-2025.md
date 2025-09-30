# Correção Fundamental da Lógica de Fatos vs Dimensões

**Data:** 30/09/2025  
**Versão:** 2.2  
**Tipo:** Correção Crítica de Arquitetura

---

## 🚨 Problema Identificado

O sistema de dashboard personalizável continha um **erro fundamental de arquitetura** que bloqueava combinações analíticas válidas.

### Lógica Incorreta (Antes)

```typescript
// ❌ ERRADO: Tentava buscar dados da tabela de cadastro
if (yAxis === 'sales' && xAxis === 'product') {
  // Bloqueava porque "não existe relacionamento direto"
  // Mas sales TEM product_id!
  return { isValid: false };
}
```

### Comportamento Problemático

1. **Bloqueava `sales × products`** apesar de `sales.product_id` existir
2. **Bloqueava `goals × sellers`** apesar de `goals.user_id` ser o vendedor
3. **Tentava buscar de tabelas erradas** (ex: `SELECT * FROM products` para vendas por produto)

### Impacto

- ❌ Combinações válidas marcadas como inválidas
- ❌ Queries incorretas e sem resultados
- ❌ Limitação artificial da capacidade analítica (-18% de combinações válidas)

---

## ✅ Solução Implementada

### Nova Regra de Ouro

> **Uma combinação Y-axis × X-axis é válida se e somente se a tabela de FATOS (Y-axis) possui uma Foreign Key (direta ou indireta) para a dimensão (X-axis).**

### Princípios Fundamentais

1. **NUNCA buscar dados de tabelas de cadastro** (products, users, offices)
2. **SEMPRE buscar da tabela de FATOS** (sales, commissions, clients, goals)
3. **JOINs apenas para obter NOMES**, não para agregar dados
4. **Validar com base em FKs reais**, não em suposições

---

## 🔧 Mudanças Técnicas

### 1. Matriz de Compatibilidade Reescrita

**Arquivo:** `src/lib/chartValidation.ts`

```typescript
// ✅ CORRETO: Baseado em FKs reais
const COMPATIBILITY_MATRIX: Record<string, Record<string, boolean>> = {
  sales: {
    time: true,      // ✅ FK: sale_date
    product: true,   // ✅ FK: product_id (DIRETO!)
    seller: true,    // ✅ FK: seller_id (DIRETO!)
    office: true,    // ✅ FK: office_id
    clients: true,   // ✅ FK: client_id
  },
  goals: {
    time: true,      // ✅ FK: period_start/period_end
    product: false,  // ❌ NÃO TEM product_id
    seller: true,    // ✅ FK: user_id (É O VENDEDOR!)
    office: true,    // ✅ FK: office_id
    clients: false,  // ❌ NÃO TEM client_id
  },
  // ... outros tipos
};
```

### 2. Lógica de Query Corrigida

**Arquivo:** `src/hooks/useDynamicChartData.ts`

#### Antes (Incorreto)
```typescript
// ❌ Tentava buscar da tabela de produtos
SELECT * FROM products WHERE ...
```

#### Depois (Correto)
```typescript
// ✅ Busca da tabela de FATOS com JOIN para nomes
SELECT 
  sales.product_id,
  consortium_products.name,  -- JOIN apenas para nome
  SUM(sales.sale_value) as total
FROM sales  -- SEMPRE da tabela de FATOS!
LEFT JOIN consortium_products ON sales.product_id = consortium_products.id
WHERE sales.tenant_id = '...'
GROUP BY sales.product_id, consortium_products.name
```

### 3. Funções de Processamento Atualizadas

#### `processProductData()`
- Agora identifica a FK correta baseado no Y-axis
- Para `sales`: usa `product_id` direto
- Para `commissions`: usa `sale_id → sales.product_id` (JOIN indireto)

#### `processSellerData()`
- Para `sales`: usa `seller_id`
- Para `commissions`: usa `recipient_id` (quando `recipient_type='seller'`)
- Para `goals`: usa `user_id` (É O VENDEDOR!)
- Para `clients`: usa `responsible_user_id`

#### `getSelectFields()`
- Construção de SELECTs sempre da tabela de FATOS
- JOINs adicionados apenas para obter nomes legíveis
- Comentários explicando cada FK utilizada

### 4. Filtros Específicos por Tipo

```typescript
// Para metas por vendedor: filtrar apenas individuais
if (config.yAxis.type === 'goals' && config.xAxis === 'seller') {
  query = query.eq('goal_type', 'individual');
}

// Para comissões por vendedor: filtrar apenas recipient_type='seller'
if (config.yAxis.type === 'commissions' && config.xAxis === 'seller') {
  query = query.eq('recipient_type', 'seller');
}
```

---

## 📊 Mapeamento de Foreign Keys

### Tabela: `sales`
```
✅ sale_date        → Time
✅ product_id       → Products (DIRETO)
✅ seller_id        → Sellers (DIRETO)
✅ office_id        → Offices
✅ client_id        → Clients
```

### Tabela: `commissions`
```
✅ due_date         → Time
✅ sale_id → product_id → Products (INDIRETO via JOIN)
✅ recipient_id     → Sellers (quando recipient_type='seller')
✅ recipient_id     → Offices (quando recipient_type='office')
✅ sale_id → client_id → Clients (INDIRETO via JOIN)
```

### Tabela: `clients`
```
✅ created_at       → Time
✅ responsible_user_id → Sellers
✅ office_id        → Offices
❌ Sem product_id
❌ Sem client_id (não faz sentido)
```

### Tabela: `goals`
```
✅ period_start/end → Time
✅ user_id          → Sellers (É O VENDEDOR!)
✅ office_id        → Offices
❌ Sem product_id
❌ Sem client_id
```

---

## 📈 Resultados

### Estatísticas

| Métrica | Antes (v2.1) | Depois (v2.2) | Melhoria |
|---------|--------------|---------------|----------|
| Combinações Válidas | 71 | 84 | **+13 (+18%)** |
| Taxa de Utilização | 59.2% | 70% | **+10.8%** |
| Combinações Bloqueadas Incorretamente | 13 | 0 | **-100%** ✅ |

### Novas Análises Habilitadas

1. ✅ **Vendas por Produto** (antes bloqueado incorretamente)
2. ✅ **Comissões por Produto** (JOIN indireto via sales)
3. ✅ **Metas por Vendedor** (user_id é o vendedor)
4. ✅ **Todas as combinações com FKs diretas**

---

## 🎯 Impacto de Negócio

### Análises Agora Possíveis

1. **Performance de Produtos:**
   - Faturamento por produto
   - Número de vendas por produto
   - Ticket médio por produto
   - Comissões geradas por produto

2. **Performance de Vendedores:**
   - Vendas por vendedor
   - Comissões recebidas por vendedor
   - Metas individuais por vendedor
   - Novos clientes por vendedor

3. **Análises Temporais:**
   - Evolução de vendas por produto ao longo do tempo
   - Acompanhamento de metas mensais por vendedor
   - Sazonalidade por produto

---

## 🔍 Validação

### Testes Realizados

✅ `sales × products` com `sum(sale_value)` → Funciona  
✅ `sales × sellers` com `count(id)` → Funciona  
✅ `goals × sellers` com `sum(target_amount)` → Funciona  
✅ `commissions × products` com `sum(commission_amount)` → Funciona  
✅ Todas as 84 combinações válidas testadas → Funcionam

### Testes de Invalidação

❌ `clients × products` → Corretamente bloqueado (sem FK)  
❌ `goals × products` → Corretamente bloqueado (sem FK)  
❌ `clients × clients` → Corretamente bloqueado (não faz sentido)

---

## 📝 Lições Aprendidas

1. **Sempre validar com a estrutura real do banco** em vez de suposições
2. **Documentar FKs explicitamente** para evitar confusão
3. **Queries devem sempre partir da tabela de fatos**, não de dimensões
4. **JOINs são para enriquecer dados**, não para buscar dados agregados

---

## 🚀 Próximos Passos

1. ✅ Documentação atualizada em `matriz-compatibilidade-dashboard.md`
2. ✅ Testes de todas as novas combinações habilitadas
3. 🔄 Monitorar performance das queries com JOINs indiretos
4. 🔄 Considerar criação de views materializadas para otimização futura

---

## 📚 Arquivos Modificados

- `src/lib/chartValidation.ts` (matriz de compatibilidade)
- `src/hooks/useDynamicChartData.ts` (lógica de query e processamento)
- `documentacao/referencia/matriz-compatibilidade-dashboard.md` (documentação)
- `documentacao/alteracoes/correcao-fundamental-logica-fatos-30-09-2025.md` (este arquivo)

---

**Conclusão:** Esta correção fundamental transforma o dashboard de uma ferramenta limitada artificialmente em uma plataforma analítica completa, respeitando a estrutura real do banco de dados e maximizando as combinações válidas possíveis.
