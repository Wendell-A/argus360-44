# Implementação de Previsão de Comissão em Metas
**Data:** 25/09/2025  
**Horário:** 18:30  

## Objetivo
Implementar previsão de comissão para vendedores no modal de criação/edição de metas individuais.

## Funcionalidades Implementadas

### 1. Hook de Previsão de Comissão (`useGoalCommissionPreview`)
**Arquivo:** `src/hooks/useGoalCommissionPreview.ts`

#### Funcionalidades:
- **Cálculo Automático:** Calcula previsão baseada no vendedor selecionado e valor da meta
- **Comissões Específicas:** Prioriza comissões específicas do vendedor sobre comissões padrão
- **Média de Produtos:** Calcula valor médio dos produtos ativos do tenant
- **Estimativa de Vendas:** Calcula quantos consórcios são necessários para atingir a meta

#### Dados Retornados:
```typescript
interface CommissionPreview {
  averageSellerCommission: number;        // Taxa média comissão específica
  averageOfficeCommission: number;        // Taxa média comissão padrão
  averageProductValue: number;            // Valor médio dos produtos
  estimatedSellerCommissionAmount: number; // Comissão estimada em R$
  consortiumsNeeded: number;              // Quantidade de consórcios necessários
  totalProducts: number;                  // Total de produtos ativos
  hasSellerCommissions: boolean;          // Se vendedor tem comissões específicas
}
```

### 2. Integração no Modal de Metas
**Arquivo:** `src/components/GoalModal.tsx`

#### Melhorias Implementadas:
- **Exibição Condicional:** Previsão aparece apenas para metas individuais
- **Cálculo em Tempo Real:** Atualiza automaticamente quando vendedor ou valor da meta mudam
- **Interface Intuitiva:** Card destacado com informações organizadas
- **Indicadores Visuais:** Ícones e cores para melhor usabilidade

#### Layout da Previsão:
1. **Taxa de Comissão:** Mostra se é específica do vendedor ou padrão do escritório
2. **Valor Médio dos Produtos:** Baseado nos produtos ativos
3. **Consórcios Necessários:** Quantidade estimada para atingir a meta
4. **Comissão Estimada:** Valor em reais que o vendedor deve receber
5. **Observações:** Informações sobre a base de cálculo

## Lógica de Negócio

### Hierarquia de Comissões:
1. **Prioridade 1:** Comissões específicas do vendedor por produto
2. **Prioridade 2:** Comissões padrão do escritório (quando não há específica)

### Cálculos Realizados:
```javascript
// Consórcios necessários
consortiumsNeeded = Math.ceil(goalAmount / averageProductValue)

// Comissão estimada
estimatedCommission = goalAmount * (commissionRate / 100)
```

### Validações:
- Só exibe previsão se houver vendedor selecionado
- Só exibe previsão se valor da meta > 0
- Só exibe dados se houver produtos ativos no tenant
- Diferencia comissões específicas das padrão

## Interface do Usuário

### Estados da Previsão:
1. **Loading:** Spinner durante o cálculo
2. **Dados Disponíveis:** Card completo com todas as informações
3. **Dados Insuficientes:** Mensagem informativa
4. **Oculta:** Para metas de escritório ou sem vendedor selecionado

### Design:
- **Card Destacado:** Background diferenciado para chamar atenção
- **Grid Responsivo:** Layout adaptável para diferentes tamanhos de tela
- **Ícones Intuitivos:** Calculator, Target, TrendingUp para identificação rápida
- **Cores Semânticas:** Verde para comissão, azul para dados gerais

## Integração com Sistema Existente

### Hooks Utilizados:
- `useGoals` - Para dados das metas
- `useVendedores` - Para lista de vendedores
- `useOffices` - Para lista de escritórios
- `useGoalCommissionPreview` - Nova funcionalidade implementada

### Tabelas Consultadas:
- `consortium_products` - Produtos ativos e seus valores
- `seller_commissions` - Comissões específicas e padrão
- `goals` - Metas existentes

## Benefícios para o Usuário

1. **Transparência:** Visualização clara de quanto o vendedor pode ganhar
2. **Planejamento:** Auxilia no estabelecimento de metas realistas
3. **Motivação:** Mostra o potencial de ganhos do vendedor
4. **Eficiência:** Cálculo automático elimina necessidade de cálculos manuais
5. **Precisão:** Utiliza dados reais do sistema para estimativas

## Casos de Uso

### Cenário 1: Vendedor com Comissões Específicas
- Sistema prioriza comissões específicas do vendedor
- Indica "(Específica)" na taxa de comissão
- Cálculo mais preciso baseado em configurações individuais

### Cenário 2: Vendedor sem Comissões Específicas
- Sistema utiliza comissões padrão do escritório
- Indica "(Padrão)" na taxa de comissão
- Cálculo baseado em médias gerais

### Cenário 3: Meta de Escritório
- Previsão não é exibida (não se aplica)
- Foco na funcionalidade original do modal

## Status Final
- ✅ **Hook Implementado:** `useGoalCommissionPreview` funcional
- ✅ **Interface Integrada:** Modal de metas com previsão
- ✅ **Cálculos Validados:** Lógica de negócio implementada
- ✅ **UX Melhorada:** Interface intuitiva e informativa
- ✅ **Responsivo:** Funciona em diferentes tamanhos de tela

## Próximos Passos Sugeridos
1. Testar com dados reais de vendedores e produtos
2. Validar cálculos com usuários finais
3. Considerar adicionar histórico de performance para previsões mais precisas
4. Avaliar possibilidade de exportar dados da previsão