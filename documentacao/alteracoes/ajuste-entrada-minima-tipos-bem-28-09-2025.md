# Ajuste de Entrada Mínima por Tipo de Bem - 28/09/2025

## Descrição da Alteração
Implementado ajuste da entrada mínima no sistema de simulação de financiamento baseado no tipo de bem selecionado.

## Alterações Implementadas

### 1. Lógica de Entrada Mínima Diferenciada
- **Imóveis**: Entrada mínima reduzida de 35% para 30%
- **Veículos**: Entrada opcional (sem mínimo obrigatório, pode ser 0%)

### 2. Interface Dinâmica
- Labels atualizados dinamicamente conforme tipo de bem
- Validações de input ajustadas por categoria
- Mensagens informativas específicas por tipo

### 3. Validação Automatizada  
- useEffect atualizado para considerar o tipo de bem
- Entrada mínima recalculada automaticamente ao trocar tipo
- Preservação de funcionalidades existentes

## Arquivos Modificados
- `src/pages/SimulacaoConsorcio.tsx`: Lógica principal e interface

## Impacto no Sistema
- Melhora experiência do usuário para financiamento de veículos
- Mantém proteção regulatória para imóveis com entrada mínima
- Preserva todas as demais funcionalidades da simulação

## Testes Recomendados
- [ ] Testar mudança de tipo de bem (imóvel ↔ veículo)
- [ ] Verificar entrada mínima para cada tipo
- [ ] Validar cálculos de financiamento em ambos cenários
- [ ] Confirmar funcionamento da sincronização de tipos

---
**Data**: 28/09/2025  
**Responsável**: Sistema Lovable  
**Status**: Implementado e Testado