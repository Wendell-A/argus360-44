# Adição de Clientes como Dimensão de Agrupamento (X-Axis)

**Data:** 30/09/2025  
**Versão:** 2.1  
**Tipo:** Feature Enhancement  
**Status:** ✅ Implementado

---

## 📋 Resumo Executivo

Implementação da funcionalidade de análise de comportamento de clientes através da adição de "Clientes" como dimensão de agrupamento (X-axis) no dashboard personalizável. Esta mudança permite análises cruciais como CLV (Customer Lifetime Value), ticket médio por cliente e comissões geradas por cliente.

---

## 🎯 Problema Identificado

### Contexto
A matriz de compatibilidade anterior tratava a tabela `clients` exclusivamente como uma tabela de fatos (Y-axis), limitando a análise a apenas **contagem de novos clientes**. Isso impedia análises fundamentais de comportamento do cliente, como:

- ❌ Total vendido por cliente (CLV)
- ❌ Número de vendas por cliente (frequência)
- ❌ Ticket médio por cliente
- ❌ Comissões geradas por cliente

### Limitação Técnica
```typescript
// ANTES: Apenas Y-axis (métrica)
YAxisType = 'sales' | 'commissions' | 'clients' | 'goals'
XAxisType = 'time' | 'product' | 'seller' | 'office'

// ❌ Não era possível: "Vendas agrupadas por Cliente"
// ✅ Era possível apenas: "Contagem de Clientes agrupada por Tempo/Vendedor/Escritório"
```

---

## ✅ Solução Implementada

### Mudança Conceitual
- **Y-axis "Novos Clientes"** (renomeado): Contagem de **aquisição** de clientes
- **X-axis "Clientes"** (novo): Dimensão para análise de **comportamento** de clientes existentes

### Mudanças Técnicas

#### 1. Renomear Métrica (Tarefa 1)
**Arquivo:** `src/components/WidgetConfigModal.tsx`
```typescript
const METRIC_TYPES = [
  { value: 'sales', label: 'Vendas' },
  { value: 'commissions', label: 'Comissões' },
  { value: 'clients', label: 'Novos Clientes' }, // ← RENOMEADO
  { value: 'goals', label: 'Metas' },
];
```

#### 2. Adicionar Clientes como X-Axis (Tarefa 2)
**Arquivo:** `src/components/WidgetConfigModal.tsx`
```typescript
const X_AXIS_OPTIONS = [
  { value: 'time', label: 'Tempo' },
  { value: 'products', label: 'Produtos' },
  { value: 'sellers', label: 'Vendedores' },
  { value: 'offices', label: 'Escritórios' },
  { value: 'clients', label: 'Clientes' }, // ← NOVO
];
```

**Arquivos:** `src/lib/chartValidation.ts`, `src/utils/dashboardTestMatrix.ts`
```typescript
export type XAxisType = 'time' | 'product' | 'seller' | 'office' | 'clients'; // ← Adicionado 'clients'

const COMPATIBILITY_MATRIX = {
  sales: {
    time: true,
    product: true,
    seller: true,
    office: true,
    clients: true,  // ← NOVO: Vendas por cliente
  },
  commissions: {
    time: true,
    product: true,
    seller: true,
    office: true,
    clients: true,  // ← NOVO: Comissões por cliente (via JOIN)
  },
  clients: {
    time: true,
    product: false,
    seller: true,
    office: true,
    clients: false, // ← Não faz sentido agrupar clientes por clientes
  },
  goals: {
    time: true,
    product: false,
    seller: true,
    office: true,
    clients: false, // ← Metas não têm FK para clientes
  },
};
```

#### 3. Implementar Backend (Tarefa 3)
**Arquivo:** `src/hooks/useDynamicChartData.ts`

**3a. Atualizar `getSelectFields()` para incluir JOINs:**
```typescript
case 'sales':
  let salesSelect = `${baseFields}, sale_value, sale_date, seller_id, product_id, office_id, status`;
  
  // Se X-axis é clientes, incluir client_id e JOIN com clients
  if (xType === 'clients') {
    salesSelect += `, client_id, clients(name)`;
  }
  
  return salesSelect;

case 'commissions':
  let commSelect = `${baseFields}, commission_amount, due_date, recipient_id, recipient_type, commission_type, sale_id`;
  
  // Se X-axis é clientes, precisamos do JOIN com sales -> clients
  if (xType === 'clients') {
    commSelect += `, sales!inner(client_id, clients(name))`;
  }
  
  return commSelect;
```

**3b. Adicionar função `processClientData()`:**
```typescript
function processClientData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  
  // Agrupar dados com nomes de clientes
  const clientMap = new Map<string, { name: string; values: number[] }>();
  
  data.forEach(item => {
    let clientId: string;
    let clientName: string;
    
    // Para comissões, buscar via sales.clients
    if (config.yAxis.type === 'commissions' && item.sales?.clients) {
      clientId = item.sales.client_id;
      clientName = item.sales.clients.name;
    } else if (config.yAxis.type === 'sales') {
      clientId = item.client_id;
      clientName = item.clients?.name || `Cliente ${clientId?.slice(0, 8) || 'N/A'}`;
    } else {
      return; // Para outros tipos, pular
    }
    
    if (!clientId) return;
    
    const value = parseFloat(item[valueField] || 0);
    
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, { name: clientName, values: [] });
    }
    
    clientMap.get(clientId)!.values.push(value);
  });

  // Calcular agregação e converter para array
  let result = Array.from(clientMap.entries())
    .map(([clientId, data]) => {
      const aggregatedValue = aggregateValues(data.values, config.yAxis.aggregation || 'sum');
      return {
        name: data.name,
        value: aggregatedValue
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Aplicar lógica de "Others" se configurado
  if (config.aggregationFilters?.clients?.type === 'others' && result.length > 5) {
    const top5 = result.slice(0, 5);
    const othersValue = result.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    if (othersValue > 0) {
      top5.push({
        name: config.aggregationFilters.clients.otherLabel || 'Outros Clientes',
        value: othersValue
      });
    }
    
    return top5;
  }

  return result.slice(0, 10);
}
```

**3c. Adicionar ao switch de `processChartData()`:**
```typescript
switch (config.xAxis) {
  case 'time':
    return processTimeData(processedData, config);
  case 'products':
    return processProductData(processedData, config);
  case 'sellers':
    return processSellerData(processedData, config);
  case 'offices':
    return processOfficeData(processedData, config);
  case 'clients':
    return processClientData(processedData, config); // ← NOVO
  default:
    return processTimeData(processedData, config);
}
```

#### 4. Atualizar Interfaces TypeScript
**Arquivo:** `src/hooks/useDashboardPersonalization.ts`
```typescript
export interface ChartConfig {
  // ... outros campos
  xAxis?: 'time' | 'products' | 'sellers' | 'offices' | 'clients'; // ← Adicionado 'clients'
  aggregationFilters?: {
    products?: AggregationFilter;
    offices?: AggregationFilter;
    sellers?: AggregationFilter;
    clients?: AggregationFilter; // ← NOVO
  };
}

export interface MetricConfig {
  // ... outros campos
  aggregationFilters?: {
    products?: AggregationFilter;
    offices?: AggregationFilter;
    sellers?: AggregationFilter;
    clients?: AggregationFilter; // ← NOVO
  };
}

export interface ListConfig {
  // ... outros campos
  aggregationFilters?: {
    products?: AggregationFilter;
    offices?: AggregationFilter;
    sellers?: AggregationFilter;
    clients?: AggregationFilter; // ← NOVO
  };
}
```

#### 5. Atualizar Documentação (Tarefa 4)
**Arquivo:** `documentacao/referencia/matriz-compatibilidade-dashboard.md`
- Renomeada seção "Clientes" para "Novos Clientes" no Y-axis
- Adicionada linha "Clientes" em todas as tabelas de X-axis
- Atualizado resumo estatístico: 96 → 120 combinações totais, 61 → 71 válidas
- Adicionado changelog v2.1 com detalhes das mudanças

---

## 📊 Impacto da Mudança

### Estatísticas
| Métrica | Antes (v2.0) | Depois (v2.1) | Delta |
|---------|-------------|---------------|-------|
| **Total de Combinações** | 96 | 120 | +24 (+25%) |
| **Combinações Válidas** | 61 | 71 | +10 (+16%) |
| **Taxa de Aproveitamento** | 63.5% | 59.2% | -4.3pp (esperado) |

### Novos Casos de Uso Habilitados
1. **Vendas por Cliente (5 agregações):**
   - ✅ `sum`: Total vendido por cliente (CLV)
   - ✅ `count`: Número de vendas por cliente (frequência)
   - ✅ `avg`: Ticket médio por cliente
   - ✅ `min`: Menor venda por cliente
   - ✅ `max`: Maior venda por cliente

2. **Comissões por Cliente (5 agregações):**
   - ✅ `sum`: Total de comissão gerada por cliente
   - ✅ `count`: Número de comissões por cliente
   - ✅ `avg`: Comissão média por cliente
   - ✅ `min`: Menor comissão por cliente
   - ✅ `max`: Maior comissão por cliente

---

## 🔍 Considerações de Performance

### JOINs Necessários
```typescript
// Para Vendas por Cliente (direto - performático)
sales -> clients (via client_id FK)

// Para Comissões por Cliente (indireto - atenção)
commissions -> sales -> clients (2 JOINs)
```

### Otimizações Implementadas
1. **Uso de índices existentes:** As FKs `client_id` já possuem índices
2. **Limit de resultados:** Top 10 clientes por padrão
3. **Suporte a "Others":** Agregação de clientes além do top 5 em categoria "Outros"
4. **Filtro de valores zerados:** Clientes sem valor são excluídos automaticamente

### Monitoramento Recomendado
- ⚠️ Monitorar performance de queries com `commissions -> sales -> clients`
- ⚠️ Considerar adicionar índice composto se volume crescer: `(sale_id, client_id)`

---

## ✅ Validação e Testes

### Cenários de Teste
1. ✅ **Vendas por Cliente + sum**: Top 10 clientes com maior faturamento
2. ✅ **Vendas por Cliente + count**: Clientes com mais compras
3. ✅ **Vendas por Cliente + avg**: Ticket médio por cliente
4. ✅ **Comissões por Cliente + sum**: Clientes que mais geraram comissões
5. ✅ **Novos Clientes por Tempo + count**: Aquisição mensal de clientes (funcionalidade antiga preservada)
6. ✅ **Validação de combinações inválidas**: "Novos Clientes por Clientes" corretamente bloqueado

### Casos Extremos Tratados
- ✅ Clientes sem vendas (filtrados)
- ✅ Vendas sem `client_id` NULL (puladas)
- ✅ Comissões de produtos/vendedores sem cliente associado (puladas)

---

## 🚀 Benefícios de Negócio

### Para Gestores
1. **Visão 360º do cliente:** Vendas, comissões e comportamento em um único lugar
2. **Identificação de VIPs:** Top clientes por faturamento e frequência
3. **Segmentação inteligente:** CLV alto vs. baixo, clientes ativos vs. inativos
4. **Análise de rentabilidade:** Comissões geradas vs. esforço de vendas por cliente

### Para Vendedores
1. **Priorização:** Foco em clientes de maior valor
2. **Ações comerciais:** Identificar clientes com ticket médio baixo para upsell
3. **Relacionamento:** Frequência de compra ajuda no timing de abordagem

### Para Analistas
1. **Modelagem de CLV:** Dados históricos para prever valor vitalício
2. **Churn prediction:** Identificar clientes inativos
3. **Cross-sell/Up-sell:** Análise de padrões de compra por cliente

---

## 🔄 Próximos Passos Sugeridos

### Curto Prazo
- [ ] Adicionar filtros de cliente no seletor de agregação
- [ ] Implementar drill-down: Clicar em cliente → Ver detalhes de vendas
- [ ] Criar dashboard pré-configurado "Análise de Clientes VIP"

### Médio Prazo
- [ ] Adicionar métrica de "Recência" (dias desde última compra)
- [ ] Implementar segmentação RFM (Recency, Frequency, Monetary)
- [ ] Criar alertas de clientes em risco de churn

### Longo Prazo
- [ ] Integrar com modelo de ML para CLV prediction
- [ ] Análise de coortes por data de aquisição
- [ ] Implementar "Jornada do Cliente" visual

---

## 📚 Arquivos Modificados

### Código
1. ✅ `src/components/WidgetConfigModal.tsx` - UI: Opções de configuração
2. ✅ `src/lib/chartValidation.ts` - Validação: Matriz de compatibilidade
3. ✅ `src/utils/dashboardTestMatrix.ts` - Testes: Casos de teste atualizados
4. ✅ `src/hooks/useDynamicChartData.ts` - Backend: Lógica de busca e processamento
5. ✅ `src/hooks/useDashboardPersonalization.ts` - Tipos: Interfaces TypeScript

### Documentação
6. ✅ `documentacao/referencia/matriz-compatibilidade-dashboard.md` - Matriz atualizada
7. ✅ `documentacao/alteracoes/adicao-clientes-como-dimensao-30-09-2025.md` - Este documento

---

## 👥 Responsáveis

- **Implementação:** Sistema Argos360 AI
- **Revisão Técnica:** Pendente
- **Aprovação de Negócio:** Pendente
- **Deploy:** Pendente

---

## 📅 Timeline

| Data | Evento |
|------|--------|
| 30/09/2025 | ✅ Implementação completa |
| 30/09/2025 | ⏳ Revisão técnica |
| TBD | ⏳ Testes de integração |
| TBD | ⏳ Deploy em produção |

---

**Fim do Documento**
