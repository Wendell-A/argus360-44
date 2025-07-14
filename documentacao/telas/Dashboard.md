
# Dashboard - Documentação

## RPD (Requisitos, Processos e Dados)

### Requisitos Funcionais
- RF001: Exibir métricas principais do mês atual
- RF002: Mostrar gráficos de vendas mensais
- RF003: Apresentar evolução das comissões
- RF004: Listar top vendedores em gráfico pizza
- RF005: Exibir vendas recentes
- RF006: Permitir filtro por período (Janeiro 2024)

### Requisitos Não Funcionais
- RNF001: Interface responsiva para desktop e mobile
- RNF002: Carregamento dos gráficos em menos de 3 segundos
- RNF003: Atualização automática dos dados

### Processos
1. **Carregamento da Dashboard**
   - Sistema carrega métricas do mês
   - Busca dados para gráficos
   - Monta visualizações

2. **Atualização de Dados**
   - Dados são atualizados periodicamente
   - Gráficos são re-renderizados

### Dados Utilizados
- Vendas mensais (quantidade e valores)
- Comissões pagas e pendentes
- Performance dos vendedores
- Vendas recentes
- Metas mensais

## Schema de Dados

```typescript
interface DashboardData {
  metricas: {
    vendasMes: number;
    comissoesPagas: string;
    vendedoresAtivos: number;
    metaMensal: string;
  };
  
  vendasMensais: Array<{
    month: string;
    vendas: number;
    comissoes: number;
  }>;
  
  topVendedores: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  
  vendasRecentes: Array<{
    cliente: string;
    vendedor: string;
    valor: string;
    comissao: string;
    data: string;
  }>;
}
```

## FlowChart (Fluxo Textual)

```
INÍCIO Dashboard
├── Usuário acessa rota "/"
├── Sistema carrega componente Dashboard
├── Busca dados das métricas
│   ├── Vendas do mês atual
│   ├── Comissões pagas
│   ├── Vendedores ativos
│   └── Percentual da meta
├── Busca dados dos gráficos
│   ├── Vendas mensais (6 meses)
│   ├── Comissões mensais
│   └── Performance vendedores
├── Busca vendas recentes (últimas 3)
├── Renderiza interface
│   ├── Header com título e data
│   ├── Grid de métricas (4 cards)
│   ├── Gráficos lado a lado
│   │   ├── Gráfico de barras (vendas)
│   │   └── Gráfico de linha (comissões)
│   └── Seção inferior
│       ├── Gráfico pizza (vendedores)
│       └── Lista vendas recentes
└── FIM
```

## Componentes Utilizados

### Principais
- `MetricCard`: Cards de métricas
- `Card`, `CardHeader`, `CardTitle`, `CardContent`: Estrutura dos cards
- `ResponsiveContainer`, `BarChart`, `LineChart`, `PieChart`: Gráficos

### Ícones
- `TrendingUp`, `DollarSign`, `Users`, `Target`, `Calendar`, `Award`

## Estados e Interações

### Estados
- Dados carregados/carregando
- Período selecionado (fixo: Janeiro 2024)

### Interações Possíveis
- Hover nos gráficos (tooltip)
- Visualização detalhada dos dados
- Navegação para outras seções via sidebar

## Melhorias Futuras
- Filtros de período dinâmicos
- Drill-down nos gráficos
- Exportação de dados
- Notificações de metas atingidas
