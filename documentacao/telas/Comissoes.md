
# Comissões - Documentação

## RPD (Requisitos, Processos e Dados)

### Requisitos Funcionais
- RF001: Listar todas as comissões cadastradas
- RF002: Distinguir comissões pagas e pendentes
- RF003: Exibir detalhes da venda vinculada
- RF004: Permitir processar pagamentos em lote
- RF005: Filtrar por status e período
- RF006: Exportar relatório de comissões
- RF007: Calcular totais e médias
- RF008: Controlar datas de pagamento

### Requisitos Não Funcionais
- RNF001: Cálculos precisos de comissões
- RNF002: Auditoria de alterações
- RNF003: Interface clara para status financeiro

### Processos
1. **Geração de Comissões**
   - Criadas automaticamente na venda
   - Cálculo baseado na taxa do vendedor
   - Status inicial: Pendente

2. **Processamento de Pagamentos**
   - Seleção de comissões pendentes
   - Alteração de status para Pago
   - Registro de data de pagamento

3. **Controle Financeiro**
   - Acompanhamento de valores
   - Relatórios de pagamentos
   - Conciliação mensal

### Dados Utilizados
- Dados da venda original
- Informações do vendedor
- Cálculos de comissão
- Status de pagamento
- Datas relevantes

## Schema de Dados

```typescript
interface Comissao {
  id: number;
  vendedor: string;
  cliente: string;
  valorVenda: string;
  taxaComissao: string;
  valorComissao: string;
  dataVenda: string;
  dataPagamento: string;
  status: 'Pago' | 'Pendente';
  consorcio: string;
}

interface ComissoesState {
  comissoes: Comissao[];
  filtroStatus: string;
  loading: boolean;
  metricas: {
    totalMes: string;
    comissoesPagas: string;
    pendentes: string;
    taxaMedia: string;
  };
}
```

## FlowChart (Fluxo Textual)

```
INÍCIO Comissões  
├── Usuário acessa rota "/comissoes"
├── Sistema carrega componente Comissões
├── Busca dados das comissões
├── Calcula métricas resumo
│   ├── Total do mês atual
│   ├── Comissões já pagas
│   ├── Comissões pendentes
│   └── Taxa média de comissão
├── Renderiza interface
│   ├── Header com título e ações
│   │   ├── Botão "Exportar"
│   │   └── Botão "Processar Pagamentos"
│   ├── Cards de resumo (4 métricas)
│   ├── Filtros de status
│   │   ├── Todas, Pagas, Pendentes
│   │   ├── Este Mês, Último Mês
│   └── Tabela de comissões
│       ├── Vendedor e ID
│       ├── Cliente
│       ├── Tipo de consórcio (badge)
│       ├── Valor da venda
│       ├── Taxa de comissão (destaque roxo)
│       ├── Valor da comissão (destaque verde)
│       ├── Data da venda
│       ├── Data de pagamento
│       └── Status (badge colorida)
├── Cálculos financeiros
│   ├── Valor comissão = Valor venda × Taxa
│   ├── Total pagas = Soma(comissões pagas)
│   ├── Total pendentes = Soma(comissões pendentes)
│   └── Taxa média = Média(todas as taxas)
├── Interações possíveis
│   ├── Clique filtros → Aplica filtro na tabela
│   ├── Clique "Exportar" → Gera arquivo Excel/PDF
│   ├── Clique "Processar Pagamentos" → Modal seleção
│   └── Seleção múltipla → Ações em lote
└── FIM
```

## Componentes Utilizados

### Principais
- `Table`: Listagem de comissões
- `Badge`: Status e tipo de consórcio
- `Button`: Filtros e ações
- `Card`: Cards de métricas

### Ícones
- `DollarSign`: Valores monetários
- `Download`: Exportação
- `Calendar`: Datas
- `TrendingUp`: Métricas

## Estados e Interações

### Estados
- Lista de comissões carregada
- Filtros aplicados
- Seleção múltipla ativa
- Modal de processamento

### Interações
- Filtrar por status/período
- Processar pagamentos em lote
- Exportar relatórios
- Visualizar detalhes

## Cálculos Financeiros

### Valor da Comissão
```javascript
const valorComissao = valorVenda * (taxaComissao / 100);
```

### Totalizadores
```javascript
const totalPagas = comissoes
  .filter(c => c.status === 'Pago')
  .reduce((sum, c) => sum + parseFloat(c.valorComissao), 0);
```

## Regras de Negócio

1. **Comissão Pendente**: Aguardando pagamento
2. **Comissão Paga**: Já foi processada financeiramente
3. **Não permite**: Alterar comissão paga
4. **Auditoria**: Registra todas as alterações

## Status e Cores

### Status de Pagamento
- **Pago**: Verde (bg-green-100, text-green-800)
- **Pendente**: Amarelo (bg-yellow-100, text-yellow-800)

### Valores Destacados
- **Taxa de Comissão**: Roxo
- **Valor da Comissão**: Verde

## Melhorias Futuras
- Aprovação de pagamentos
- Histórico de alterações
- Integração bancária
- Relatórios fiscais
- Simulação de cenários
- Dashboard financeiro específico
