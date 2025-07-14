
# Fluxo de Vendas - Argus360

## Visão Geral

O fluxo de vendas integra clientes, consórcios, vendedores e comissões em um processo unificado de gestão comercial.

## Fluxo Principal de Venda

```
INÍCIO Nova Venda
├── Vendedor acessa sistema
├── Seleciona/Cadastra cliente
│   ├── Se cliente novo:
│   │   ├── Preenche dados (PF/PJ)
│   │   ├── Valida CPF/CNPJ
│   │   ├── Define vendedor responsável
│   │   └── Salva cliente com status "Prospect"
│   └── Se cliente existente:
│       └── Carrega dados do cliente
├── Seleciona consórcio disponível
│   ├── Verifica cotas disponíveis
│   ├── Consulta valor do bem
│   ├── Confirma taxa de comissão
│   └── Valida se consórcio está ativo
├── Registra a venda
│   ├── Cria registro de venda
│   ├── Atualiza status cliente para "Ativo"
│   ├── Decrementa cotas disponíveis
│   ├── Calcula valor da comissão
│   ├── Cria registro de comissão (status "Pendente")
│   └── Registra na auditoria
├── Gera documentação
│   ├── Contrato de adesão
│   ├── Comprovante de venda
│   └── Nota de comissão
├── Notificações
│   ├── Email para cliente
│   ├── Notificação para gestor
│   └── Alerta se meta próxima
└── FIM
```

## Entidades Relacionadas

### 1. Cliente (Futuro - não implementado ainda)
```typescript
interface Cliente {
  id: number;
  tipo: 'PF' | 'PJ';
  nome: string;
  documento: string; // CPF ou CNPJ
  email: string;
  telefone: string;
  endereco: Endereco;
  vendedor_responsavel_id: number;
  status: 'Prospect' | 'Ativo' | 'Inativo';
  data_cadastro: Date;
}
```

### 2. Venda (Futuro)
```typescript
interface Venda {
  id: number;
  cliente_id: number;
  vendedor_id: number;
  consorcio_id: number;
  valor_bem: number;
  valor_entrada: number;
  numero_parcelas: number;
  data_venda: Date;
  status: 'Ativa' | 'Cancelada' | 'Quitada';
  observacoes: string;
}
```

### 3. Comissão (Já implementada na interface)
```typescript
interface Comissao {
  id: number;
  venda_id: number;
  vendedor: string;
  valor_base: number;
  taxa_comissao: number;
  valor_comissao: number;
  data_vencimento: Date;
  data_pagamento?: Date;
  status: 'Pendente' | 'Pago' | 'Cancelado';
}
```

## Processo de Qualificação do Cliente

```
INÍCIO Qualificação
├── Vendedor identifica prospect
├── Coleta informações básicas
│   ├── Necessidade do cliente
│   ├── Capacidade financeira
│   ├── Prazo desejado
│   └── Preferências de produto
├── Apresenta opções de consórcio
│   ├── Filtra por valor desejado
│   ├── Mostra prazos disponíveis
│   ├── Explica funcionamento
│   └── Calcula simulação
├── Negocia condições
│   ├── Valor de entrada
│   ├── Prazo de pagamento
│   ├── Taxa administrativa
│   └── Benefícios adicionais
├── Decisão do cliente
│   ├── Se aceita: → Processo de venda
│   ├── Se recusa: → Follow-up agendado
│   └── Se indeciso: → Nurturing
└── FIM
```

## Validações de Negócio

### Antes da Venda
1. **Cliente**
   - CPF/CNPJ válido e único
   - Dados obrigatórios preenchidos
   - Não estar na lista de restrições

2. **Consórcio**
   - Status "Ativo"
   - Cotas disponíveis > 0
   - Dentro do prazo de comercialização

3. **Vendedor**
   - Status "Ativo"
   - Permissão para vender
   - Meta não excedida (se aplicável)

### Durante a Venda
1. **Cálculos**
   - Valor da comissão = Valor do bem × Taxa
   - Valor de entrada ≥ Mínimo exigido
   - Parcelas dentro dos limites

2. **Disponibilidade**
   - Verificação em tempo real de cotas
   - Lock temporário durante processo
   - Rollback em caso de erro

## Cálculo de Comissões

### Fórmula Base
```javascript
const calcularComissao = (valorBem, taxaComissao, tipoVenda) => {
  let valorBase = valorBem;
  let taxa = taxaComissao;
  
  // Ajustes por tipo de venda
  switch (tipoVenda) {
    case 'primeira_parcela':
      // Comissão sobre entrada
      valorBase = valorEntrada;
      break;
    case 'contemplacao':
      // Comissão sobre contemplação
      taxa = taxa * 1.5; // Bônus de 50%
      break;
    case 'indicacao':
      // Comissão reduzida para indicações
      taxa = taxa * 0.3; // 30% da comissão normal
      break;
  }
  
  return valorBase * (taxa / 100);
};
```

### Tipos de Comissão

1. **Comissão Direta**
   - Venda própria do vendedor
   - Taxa integral conforme cadastro

2. **Comissão de Indicação**
   - Cliente indicado por outro vendedor
   - Taxa reduzida (30% da original)

3. **Comissão de Contemplação**
   - Bônus por contemplação do cliente  
   - Taxa adicional (50% extra)

4. **Comissão de Renovação**
   - Cliente renova consórcio
   - Taxa diferenciada

## Controle de Cotas

### Atualização Automática
```sql
-- Trigger para decrementar cotas na venda
CREATE OR REPLACE FUNCTION atualizar_cotas_consorcio()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE consorcios 
  SET cotas_vendidas = cotas_vendidas + 1
  WHERE id = NEW.consorcio_id;
  
  -- Verifica se esgotou
  UPDATE consorcios 
  SET status = 'Esgotado'
  WHERE id = NEW.consorcio_id 
  AND cotas_vendidas >= cotas;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Controle de Concorrência
- Lock otimista para evitar overselling
- Verificação dupla antes de confirmar
- Rollback automático em caso de conflito

## Status da Venda

### Ciclo de Vida
```
Proposta → Aprovada → Ativa → Quitada
    ↓         ↓         ↓
Cancelada  Cancelada  Cancelada
```

### Estados Possíveis

1. **Proposta**
   - Venda registrada mas não aprovada
   - Aguardando análise de crédito
   - Comissão não gerada ainda

2. **Aprovada**
   - Análise de crédito aprovada
   - Contrato assinado
   - Comissão gerada (status Pendente)

3. **Ativa**
   - Cliente pagando parcelas
   - Venda em andamento normal
   - Comissão pode ser paga

4. **Quitada**
   - Todas as parcelas pagas
   - Bem entregue ao cliente
   - Processo finalizado

5. **Cancelada**
   - Venda cancelada (qualquer motivo)
   - Comissão cancelada se não paga
   - Cotas liberadas para venda

## Relatórios de Vendas

### Métricas Principais
- Volume de vendas (quantidade e valor)
- Performance por vendedor
- Conversão de prospects
- Ticket médio por período
- Sazonalidade das vendas

### Dashboards
1. **Vendedor Individual**
   - Vendas do mês/trimestre
   - Comissões a receber
   - Metas vs realizado
   - Pipeline de prospects

2. **Gestor de Vendas**
   - Performance da equipe
   - Ranking de vendedores
   - Análise de produtos
   - Previsão mensal

3. **Diretoria**
   - Indicadores consolidados
   - Tendências de mercado
   - ROI por canal
   - Projeções financeiras

## Processo de Follow-up

### Prospects Não Convertidos
```
INÍCIO Follow-up
├── Sistema identifica prospects inativos
├── Vendedor recebe notificação
├── Agenda novo contato
├── Registra interação
├── Avalia interesse atual
├── Se ainda interessado:
│   └── Reagenda apresentação
└── Se não interessado:
    └── Move para "Nurturing" ou "Descartado"
```

### Nurturing de Leads
- Email marketing automatizado
- Conteúdo educativo sobre consórcios
- Ofertas especiais sazonais
- Reativação periódica

## Integração com Sistemas Externos

### Análise de Crédito (Futuro)
- SPC/Serasa/Receita Federal
- Score de crédito automatizado
- Decisão em tempo real
- Documentação digital

### Assinatura Digital
- Contratos eletrônicos
- Certificado digital
- Validação biométrica
- Armazenamento seguro

## Auditoria do Processo

### Eventos Registrados
- Criação de prospects
- Conversão para clientes
- Registros de vendas
- Alterações de status
- Cancelamentos e motivos
- Pagamentos de comissões

### Relatórios de Auditoria
- Trilha completa de cada venda
- Alterações em vendas existentes
- Vendas canceladas e motivos
- Performance vs metas estabelecidas

## Melhorias Futuras

1. **Automação**
   - CRM integrado
   - Workflow de aprovações
   - Comunicação automatizada

2. **Analytics Avançado**
   - Predição de vendas
   - Análise de churn
   - Otimização de preços

3. **Mobile**
   - App para vendedores
   - Cadastro offline
   - Sincronização automática

4. **Gamificação**
   - Ranking de vendedores
   - Badges e conquistas
   - Competições internas
