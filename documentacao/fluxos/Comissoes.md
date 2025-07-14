
# Fluxo de Comissões - Argus360

## Visão Geral

O sistema de comissões automatiza desde o cálculo até o pagamento, garantindo transparência e agilidade no processo de remuneração dos vendedores.

## Fluxo Completo de Comissões

```
INÍCIO Fluxo Comissões
├── Venda é registrada no sistema
├── Sistema calcula comissão automaticamente
│   ├── Valor base = Valor da venda
│   ├── Taxa = Taxa do vendedor para o produto
│   ├── Valor comissão = Valor base × (Taxa / 100)
│   └── Aplica regras especiais (bônus, deduções)
├── Cria registro de comissão
│   ├── Status inicial: "Pendente"
│   ├── Data vencimento = Data venda + Prazo padrão
│   ├── Vincula à venda original
│   └── Associa ao vendedor
├── Processo de aprovação (se necessário)
│   ├── Gestor revisa a comissão
│   ├── Valida cálculos e condições
│   ├── Aprova ou rejeita
│   └── Se rejeitada: retorna para análise
├── Programação de pagamento
│   ├── Adiciona à lista de pendências
│   ├── Aguarda data de vencimento
│   ├── Verifica se venda foi cancelada
│   └── Confirma dados bancários do vendedor
├── Execução do pagamento
│   ├── Processa pagamento via sistema financeiro
│   ├── Atualiza status para "Pago"
│   ├── Registra data e forma de pagamento
│   ├── Envia comprovante para vendedor
│   └── Registra na auditoria
├── Relatórios e controles
│   ├── Atualiza dashboards
│   ├── Calcula métricas de performance
│   └── Gera relatórios fiscais
└── FIM
```

## Estados da Comissão

### 1. Pendente
- **Condição**: Comissão calculada mas não paga
- **Ações**: Pode ser editada ou cancelada
- **Visibilidade**: Aparece nos relatórios de pendências

### 2. Aprovada
- **Condição**: Aprovada para pagamento
- **Ações**: Aguardando execução financeira
- **Visibilidade**: Entra na programação de pagamentos

### 3. Pago
- **Condição**: Pagamento executado com sucesso
- **Ações**: Somente leitura, histórico permanente
- **Visibilidade**: Relatórios de pagamentos realizados

### 4. Cancelado
- **Condição**: Venda cancelada ou comissão rejeitada
- **Ações**: Não será paga, histórico mantido
- **Visibilidade**: Relatórios de cancelamentos

### 5. Suspenso
- **Condição**: Problema identificado, pagamento suspenso
- **Ações**: Aguarda resolução para liberar
- **Visibilidade**: Relatório de pendências críticas

## Tipos de Comissão

### 1. Comissão Direta
```javascript
const calcularComissaoDireta = (valorVenda, taxaVendedor) => {
  return valorVenda * (taxaVendedor / 100);
};

// Exemplo: Venda R$ 50.000, Taxa 5%
// Comissão = 50.000 × 0.05 = R$ 2.500
```

### 2. Comissão por Indicação
```javascript
const calcularComissaoIndicacao = (valorVenda, taxaBase) => {
  const taxaIndicacao = taxaBase * 0.3; // 30% da taxa normal
  return valorVenda * (taxaIndicacao / 100);
};

// Exemplo: Venda R$ 50.000, Taxa base 5%
// Taxa indicação = 5% × 0.3 = 1.5%
// Comissão = 50.000 × 0.015 = R$ 750
```

### 3. Comissão Escalonada
```javascript
const calcularComissaoEscalonada = (valorVenda, metaMensal, vendasAtuais) => {
  let taxa = 5; // Taxa base
  
  const percentualMeta = (vendasAtuais / metaMensal) * 100;
  
  if (percentualMeta >= 120) {
    taxa = 7; // +40% se ultrapassar 120% da meta
  } else if (percentualMeta >= 100) {
    taxa = 6; // +20% se atingir 100% da meta
  }
  
  return valorVenda * (taxa / 100);
};
```

### 4. Bônus de Contemplação
```javascript
const calcularBonusContemplacao = (valorVenda, taxaBase) => {
  const bonusPercentual = 1.5; // 150% da comissão normal
  return valorVenda * (taxaBase / 100) * bonusPercentual;
};
```

## Regras de Cálculo

### Configurações por Tipo de Consórcio
```typescript
interface ConfiguracaoComissao {
  tipoConsorcio: 'Veiculos' | 'Imoveis' | 'Servicos';
  taxaMinima: number;
  taxaMaxima: number;
  prazoVencimento: number; // dias
  permiteAntecipacao: boolean;
  temCarencia: boolean;
  diasCarencia?: number;
}

const configuracoes: ConfiguracaoComissao[] = [
  {
    tipoConsorcio: 'Veiculos',
    taxaMinima: 3,
    taxaMaxima: 8,
    prazoVencimento: 30,
    permiteAntecipacao: true,
    temCarencia: false
  },
  {
    tipoConsorcio: 'Imoveis',
    taxaMinima: 2,
    taxaMaxima: 5,
    prazoVencimento: 45,
    permiteAntecipacao: false,
    temCarencia: true,
    diasCarencia: 60
  }
];
```

### Deduções Automáticas
```javascript
const aplicarDeducoes = (valorComissao, vendedor) => {
  let valorFinal = valorComissao;
  
  // INSS (11% até o teto)
  const inss = Math.min(valorComissao * 0.11, TETO_INSS);
  valorFinal -= inss;
  
  // IR (conforme tabela progressiva)
  const ir = calcularIR(valorComissao);
  valorFinal -= ir;
  
  // Adiantamentos
  if (vendedor.adiantamentos > 0) {
    const desconto = Math.min(valorFinal * 0.3, vendedor.adiantamentos);
    valorFinal -= desconto;
    vendedor.adiantamentos -= desconto;
  }
  
  return {
    valorBruto: valorComissao,
    valorLiquido: valorFinal,
    deducoes: { inss, ir, adiantamentos: desconto }
  };
};
```

## Processo de Aprovação

### Aprovação Automática
```javascript
const aprovarAutomaticamente = (comissao) => {
  const criterios = {
    valorMaximo: 10000,
    vendedorRegular: true,
    vendaSemRestricoes: true
  };
  
  return comissao.valor <= criterios.valorMaximo &&
         comissao.vendedor.status === 'Ativo' &&
         !comissao.venda.temRestricoes;
};
```

### Aprovação Manual
- Valores acima do limite automático
- Vendedores com restrições
- Vendas com condições especiais
- Comissões retroativas

### Workflow de Aprovação
```
INÍCIO Aprovação
├── Comissão criada automaticamente
├── Sistema verifica critérios de aprovação automática
├── Se aprovação automática:
│   ├── Status = "Aprovada"
│   └── Entra na fila de pagamento
├── Se aprovação manual necessária:
│   ├── Status = "Aguardando Aprovação"
│   ├── Notifica gestor responsável
│   ├── Gestor analisa e decide
│   ├── Se aprovada: Status = "Aprovada"
│   └── Se rejeitada: Status = "Rejeitada" + Motivo
└── FIM
```

## Programação de Pagamentos

### Calendário de Pagamentos
```typescript
interface CalendarioPagamento {
  escritorio_id: number;
  diaCorte: number; // Dia do mês para corte
  diasProcessamento: number; // Dias para processar após corte
  diaPagamento: number; // Dia fixo de pagamento
  permiteFeriados: boolean;
  antecipaDiaUtil: boolean;
}

// Exemplo: Pagamento todo dia 10
const calendario: CalendarioPagamento = {
  escritorio_id: 1,
  diaCorte: 25, // Corte dia 25
  diasProcessamento: 3, // 3 dias para processar
  diaPagamento: 10, // Paga dia 10 do mês seguinte
  permiteFeriados: false,
  antecipaDiaUtil: true
};
```

### Lote de Pagamento
```typescript
interface LotePagamento {
  id: number;
  data_criacao: Date;
  data_pagamento: Date;
  valor_total: number;
  quantidade_comissoes: number;
  status: 'Preparando' | 'Processando' | 'Concluido' | 'Erro';
  comissoes: number[]; // IDs das comissões
  arquivo_remessa?: string;
}
```

## Integração Bancária

### Geração de Arquivo de Pagamento
```javascript
const gerarArquivoRemessa = (lote) => {
  const arquivo = {
    header: {
      codigoBanco: '001',
      nomeEmpresa: 'ARGUS360 LTDA',
      dataGeracao: new Date().toISOString(),
      sequencial: lote.id
    },
    detalhes: lote.comissoes.map(comissao => ({
      cpf: comissao.vendedor.cpf,
      nome: comissao.vendedor.nome,
      banco: comissao.vendedor.banco,
      agencia: comissao.vendedor.agencia,
      conta: comissao.vendedor.conta,
      valor: comissao.valor_liquido,
      identificacao: `COM${comissao.id}`
    })),
    trailer: {
      totalRegistros: lote.comissoes.length,
      valorTotal: lote.valor_total
    }
  };
  
  return gerarCNAB240(arquivo);
};
```

### Processamento do Retorno
```javascript
const processarArquivoRetorno = (arquivo) => {
  const retorno = parseCNAB240(arquivo);
  
  retorno.detalhes.forEach(detalhe => {
    const comissaoId = extrairIdComissao(detalhe.identificacao);
    
    if (detalhe.codigo_retorno === '00') {
      // Pagamento realizado com sucesso
      atualizarComissao(comissaoId, {
        status: 'Pago',
        data_pagamento: detalhe.data_pagamento,
        numero_documento: detalhe.numero_documento
      });
    } else {
      // Erro no pagamento
      atualizarComissao(comissaoId, {
        status: 'Erro',
        motivo_erro: detalhe.descricao_erro
      });
    }
  });
};
```

## Relatórios e Controles

### Dashboard de Comissões
```typescript
interface DashboardComissoes {
  resumoMensal: {
    totalPendente: number;
    totalPago: number;
    totalCancelado: number;
    quantidadeVendedores: number;
  };
  
  proximosPagamentos: {
    data: Date;
    valor: number;
    quantidade: number;
  }[];
  
  topVendedores: {
    vendedor: string;
    valor: number;
    quantidade: number;
  }[];
  
  evolucaoMensal: {
    mes: string;
    valor: number;
  }[];
}
```

### Relatório Individual do Vendedor
```sql
-- Consulta para relatório individual
SELECT 
  c.id,
  c.data_venda,
  cl.nome as cliente,
  cons.tipo as consorcio,
  v.valor_venda,
  c.taxa_comissao,
  c.valor_comissao,
  c.status,
  c.data_pagamento
FROM comissoes c
JOIN vendas v ON c.venda_id = v.id
JOIN clientes cl ON v.cliente_id = cl.id
JOIN consorcios cons ON v.consorcio_id = cons.id
WHERE c.vendedor_id = ? 
AND c.data_venda BETWEEN ? AND ?
ORDER BY c.data_venda DESC;
```

## Auditoria e Compliance

### Registros de Auditoria
- Criação/alteração de comissões
- Aprovações e rejeições
- Processamento de pagamentos
- Correções e estornos
- Consultas a dados sensíveis

### Controles Internos
1. **Segregação de Funções**
   - Cálculo ≠ Aprovação ≠ Pagamento
   - Diferentes usuários para cada etapa

2. **Alçadas de Aprovação**
   - Até R$ 5.000: Aprovação automática
   - R$ 5.001 - R$ 20.000: Supervisor
   - Acima R$ 20.000: Gerente

3. **Validações Cruzadas**
   - Vendas vs Comissões
   - Pagamentos vs Arquivo bancário
   - Retenções vs Obrigações fiscais

## Tratamento de Exceções

### Cenários Especiais

1. **Venda Cancelada Após Pagamento**
   ```javascript
   const tratarCancelamentoAposPagamento = (vendaId) => {
     const comissao = buscarComissaoPorVenda(vendaId);
     
     if (comissao.status === 'Pago') {
       // Criar débito para próximo pagamento
       criarDebitoVendedor(comissao.vendedor_id, comissao.valor_liquido);
       
       // Registrar estorno
       registrarEstorno(comissao.id, 'Venda cancelada');
     }
   };
   ```

2. **Erro no Arquivo Bancário**
   - Reprocessamento automático
   - Notificação ao financeiro
   - Pagamento manual se necessário

3. **Divergência de Valores**
   - Bloqueio automático
   - Análise obrigatória
   - Correção com aprovação

## Melhorias Futuras

1. **IA e Machine Learning**
   - Predição de inadimplência
   - Otimização de taxas
   - Detecção de fraudes

2. **Integração Open Banking**
   - PIX para pagamentos
   - Verificação de contas em tempo real
   - Conciliação automática

3. **Portal do Vendedor**
   - Acompanhamento em tempo real
   - Simulador de comissões
   - Histórico completo

4. **Gamificação**
   - Metas dinâmicas
   - Bônus por performance
   - Ranking competitivo
