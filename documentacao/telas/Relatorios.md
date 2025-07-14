
# Relatórios - Documentação

## RPD (Requisitos, Processos e Dados)

### Requisitos Funcionais
- RF001: Exibir métricas consolidadas de 6 meses
- RF002: Gráfico combinado vendas/comissões mensais
- RF003: Distribuição por tipo de consórcio (pizza)
- RF004: Performance horizontal dos vendedores
- RF005: Evolução temporal das comissões
- RF006: Permitir filtro por período
- RF007: Exportar relatório em PDF
- RF008: Cálculos de ticket médio e conversão

### Requisitos Não Funcionais
- RNF001: Gráficos interativos com tooltips
- RNF002: Layout responsivo para visualizações
- RNF003: Performance otimizada para grandes volumes

### Processos
1. **Geração de Relatórios**
   - Consolidação de dados históricos
   - Cálculos estatísticos
   - Renderização de gráficos

2. **Análise de Performance**
   - Comparação entre períodos
   - Identificação de tendências
   - Ranking de vendedores

3. **Exportação**
   - Geração de PDF formatado
   - Inclusão de gráficos e tabelas
   - Personalização por período

### Dados Utilizados
- Vendas e comissões mensais
- Performance individual vendedores
- Distribuição por tipo consórcio
- Métricas de conversão
- Histórico temporal

## Schema de Dados

```typescript
interface RelatoriosData {
  vendasMensais: Array<{
    mes: string;
    vendas: number;
    comissoes: number;
  }>;
  
  vendedoresPerformance: Array<{
    vendedor: string;
    vendas: number;
    comissoes: number;
  }>;
  
  tiposConsorcio: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  
  metricas: {
    vendasTotais: number;
    comissoes: string;
    ticketMedio: string;
    taxaConversao: string;
  };
}
```

## FlowChart (Fluxo Textual)

```
INÍCIO Relatórios
├── Usuário acessa rota "/relatorios"
├── Sistema carrega componente Relatórios
├── Busca dados históricos (6 meses)
├── Processa cálculos estatísticos
│   ├── Soma vendas totais
│   ├── Calcula comissões acumuladas
│   ├── Computa ticket médio
│   └── Determina taxa de conversão
├── Renderiza interface
│   ├── Header com controles
│   │   ├── Botão "Período" (futuro)
│   │   └── Botão "Exportar PDF"
│   ├── Cards de métricas (4 indicadores)
│   │   ├── Vendas Totais (6m) + Meta
│   │   ├── Comissões (6m) + Variação
│   │   ├── Ticket Médio por venda
│   │   └── Taxa de Conversão %
│   ├── Gráficos superiores (lado a lado)
│   │   ├── Gráfico barras duplas
│   │   │   ├── Eixo esquerdo: Vendas
│   │   │   ├── Eixo direito: Comissões
│   │   │   └── Tooltip personalizado
│   │   └── Gráfico pizza consórcios
│   │       ├── Veículos, Imóveis, Serviços
│   │       ├── Percentuais calculados
│   │       └── Cores personalizadas
│   ├── Performance vendedores
│   │   ├── Gráfico barras horizontal
│   │   ├── Ordenado por vendas
│   │   └── Nomes truncados se necessário
│   └── Evolução comissões
│       ├── Gráfico linha temporal
│       ├── Pontos destacados
│       └── Formatação monetária
├── Cálculos automáticos
│   ├── Ticket médio = Total vendas / Qtd vendas
│   ├── Taxa conversão = Vendas / Prospects × 100
│   ├── Variação período = (Atual - Anterior) / Anterior
│   └── Meta atingida = Vendas / Meta × 100
├── Interações disponíveis
│   ├── Hover gráficos → Tooltips detalhados
│   ├── Clique "Período" → Seletor de datas
│   ├── Clique "Exportar PDF" → Download arquivo
│   └── Responsividade → Ajuste layout mobile
└── FIM
```

## Componentes Utilizados

### Gráficos (Recharts)
- `BarChart`: Vendas mensais e performance vendedores
- `LineChart`: Evolução das comissões
- `PieChart`: Distribuição por tipo
- `ResponsiveContainer`: Container responsivo
- `CartesianGrid`: Grade dos gráficos
- `Tooltip`: Informações ao hover

### Layout
- `Card`: Estrutura dos blocos
- `Button`: Controles de ação
- `Grid`: Layout responsivo

### Ícones
- `Download`: Exportação
- `Calendar`: Período
- `TrendingUp`, `DollarSign`, `Users`: Métricas

## Estados e Interações

### Estados
- Dados carregados/processados
- Período selecionado
- Loading de exportação
- Responsividade ativa

### Interações
- Seleção de período (futuro)
- Exportação PDF
- Hover nos gráficos
- Navegação entre seções

## Cálculos Estatísticos

### Métricas Principais
```javascript
// Ticket Médio
const ticketMedio = totalVendas / numeroVendas;

// Taxa de Conversão  
const taxaConversao = (vendas / prospects) * 100;

// Variação Percentual
const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
```

### Formatações
- Valores monetários: R$ X.XXXk
- Percentuais: XX%
- Números grandes: XXXk (milhares)

## Tipos de Gráficos

### 1. Barras Duplas (Vendas + Comissões)
- Dois eixos Y diferentes
- Cores distintas (azul/verde)
- Tooltip combinado

### 2. Pizza (Tipos de Consórcio)
- Labels com percentuais
- Cores predefinidas
- Tooltip com valores

### 3. Barras Horizontais (Vendedores)
- Layout horizontal para nomes
- Ordenação por performance
- Escala automática

### 4. Linha Temporal (Evolução)
- Pontos destacados
- Linha suavizada
- Gradiente opcional

## Melhorias Futuras
- Filtros dinâmicos de período
- Drill-down nos gráficos
- Comparação entre períodos
- Projeções e tendências
- Relatórios personalizáveis
- Dashboard executivo
- Alertas inteligentes
