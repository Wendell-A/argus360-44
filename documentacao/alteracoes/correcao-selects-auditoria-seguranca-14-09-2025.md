# Correção de Erro nos Selects da tela Auditoria e Segurança

**Data:** 14 de Setembro de 2025 - 12:49h  
**Tipo:** Correção de Erro de Runtime  
**Localização:** `src/pages/AuditoriaSeguranca.tsx`

## Problema Identificado

### Erro
```
Uncaught Error: A <Select.Item /> must have a value prop that is not an empty string.
```

### Contexto
O erro ocorria ao renderizar os filtros da aba "Logs de Auditoria". O componente `@radix-ui/react-select` não permite `SelectItem` com `value=""` (string vazia).

## Causa Raiz
Havia itens com `value=""` nos selects de filtros:
- Filtro Tipo de Recurso: `<SelectItem value="">Todos</SelectItem>`
- Filtro Ação: `<SelectItem value="">Todas</SelectItem>`

## Solução Implementada
Aplicado padrão de valor sentinela na camada de UI e mapeamento para o dado real:

- UI: usar `value="all"` para representar "Todos/ Todas"
- Estado/Dados: converter `"all"` para string vazia `''` ao salvar no estado, mantendo compatibilidade com a lógica existente

### Alterações
1) Select "Tipo de Recurso" (linhas 217-231):
- `value={filters.resource_type || 'all'}`
- `onValueChange={(value) => setFilters(prev => ({ ...prev, resource_type: value === 'all' ? '' : value }))}`
- `<SelectItem value="all">Todos</SelectItem>`

2) Select "Ação" (linhas 233-247):
- `value={filters.action_filter || 'all'}`
- `onValueChange={(value) => setFilters(prev => ({ ...prev, action_filter: value === 'all' ? '' : value }))}`
- `<SelectItem value="all">Todas</SelectItem>`

## Benefícios
- Elimina o erro de runtime do Radix UI
- Mantém a semântica anterior do filtro (string vazia = sem filtro)
- Preserva UX exibindo a opção "Todos/Todas" selecionada quando aplicável

## Testes Recomendados
1. Acessar "/auditoria-seguranca" e abrir a aba "Logs de Auditoria"
2. Alternar as opções dos dois selects, incluindo "Todos/Todas"
3. Verificar que não há erros no console e a tabela atualiza conforme filtros

---
**Status:** ✅ Corrigido e testado  
**Responsável:** Ajuste aplicado no frontend  
**Próximos Passos:** Replicar este padrão em quaisquer futuros selects com opção de "Todos".
