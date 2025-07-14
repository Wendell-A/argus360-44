
# Consórcios - Documentação

## RPD (Requisitos, Processos e Dados)

### Requisitos Funcionais
- RF001: Listar todas as tabelas de consórcios
- RF002: Categorizar por tipo (Veículos, Imóveis, Serviços)
- RF003: Exibir informações financeiras (valor, prazo, taxas)
- RF004: Mostrar progresso de vendas (cotas vendidas)
- RF005: Permitir criar nova tabela de consórcio
- RF006: Editar configurações das tabelas
- RF007: Visualizar vendas por consórcio
- RF008: Controlar status (Ativo/Encerrado)

### Requisitos Não Funcionais
- RNF001: Ícones visuais para cada categoria
- RNF002: Barra de progresso para cotas vendidas
- RNF003: Cálculo automático de percentuais

### Processos
1. **Listagem de Consórcios**
   - Sistema busca todas as tabelas
   - Calcula percentuais de vendas
   - Ordena por status e categoria

2. **Criação de Tabela**
   - Formulário com configurações
   - Definição de taxas e valores
   - Criação de cotas disponíveis

3. **Gestão de Vendas**
   - Controle de cotas vendidas
   - Atualização automática do progresso
   - Bloqueio quando esgotado

### Dados Utilizados
- Configurações das tabelas
- Valores e prazos
- Taxas administrativas e comissões
- Cotas totais e vendidas
- Status operacional

## Schema de Dados

```typescript
interface Consorcio {
  id: number;
  tipo: 'Veículos' | 'Imóveis' | 'Serviços';
  categoria: string;
  valor: string;
  prazo: string;
  taxaAdmin: string;
  taxaComissao: string;
  status: 'Ativo' | 'Encerrado';
  icon: LucideIcon;
  cotas: number;
  cotasVendidas: number;
}

interface ConsorciosState {
  consorcios: Consorcio[];
  loading: boolean;
  metricas: {
    tabelasAtivas: number;
    cotasVendidas: number;
    taxaMedia: string;
    valorTotal: string;
  };
}
```

## FlowChart (Fluxo Textual)

```
INÍCIO Consórcios
├── Usuário acessa rota "/consorcios"
├── Sistema carrega componente Consórcios
├── Busca dados das tabelas de consórcio
├── Calcula métricas resumo
│   ├── Total de tabelas ativas
│   ├── Cotas vendidas vs disponíveis
│   ├── Taxa média de comissão
│   └── Valor total em consórcios
├── Renderiza interface
│   ├── Header com título e botão "Nova Tabela"
│   ├── Cards de resumo (4 métricas)
│   └── Tabela de consórcios
│       ├── Tipo/Categoria com ícone
│       ├── Valor do bem
│       ├── Prazo (badge)
│       ├── Taxa administrativa (vermelho)
│       ├── Taxa de comissão (verde)
│       ├── Progresso de cotas
│       │   ├── Números (vendidas/total)
│       │   ├── Barra de progresso visual
│       │   └── Percentual calculado
│       ├── Status com badge colorida
│       └── Ações (Editar, Vendas)
├── Cálculos automáticos
│   ├── Percentual vendido = (cotasVendidas / cotas) * 100
│   ├── Largura da barra = percentual + "%"
│   └── Cor da barra baseada no status
├── Interações possíveis
│   ├── Clique "Nova Tabela" → Modal/Página cadastro
│   ├── Clique "Editar" → Modal/Página edição
│   └── Clique "Vendas" → Página vendas do consórcio
└── FIM
```

## Componentes Utilizados

### Principais
- `Table`: Listagem de consórcios
- `Badge`: Status, prazo e taxas
- `Card`: Cards de métricas
- `Button`: Ações e nova tabela

### Ícones Específicos
- `Car`: Veículos
- `Home`: Imóveis  
- `Wrench`: Serviços
- `Calculator`: Métricas

### Elementos Visuais
- Barra de progresso customizada
- Cores por categoria
- Status com cores específicas

## Estados e Interações

### Estados
- Lista de consórcios carregada
- Cálculos de progresso atualizados
- Modal de cadastro/edição
- Filtros por status

### Interações
- Criar nova tabela
- Editar configurações
- Visualizar vendas específicas
- Filtrar por status/categoria

## Cálculos Importantes

### Progresso de Vendas
```javascript
const percentual = (cotasVendidas / cotas) * 100;
const larguraBarra = `${percentual}%`;
```

### Validações de Negócio
- Cotas vendidas ≤ Cotas totais
- Taxa administrativa > 0%
- Taxa comissão > 0%
- Valor do bem > 0

## Regras de Negócio

1. **Status Ativo**: Permite vendas e alterações
2. **Status Encerrado**: Somente leitura, não permite vendas
3. **Cotas Esgotadas**: Muda status automaticamente
4. **Taxas**: Administrativas são custos, comissões são receitas

## Melhorias Futuras
- Simulador de consórcio
- Histórico de alterações
- Relatórios por categoria
- Integração com órgãos reguladores
- Alertas de cotas próximas ao limite
