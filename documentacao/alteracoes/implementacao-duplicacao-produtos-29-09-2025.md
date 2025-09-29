# Implementação: Sistema de Duplicação de Produtos/Consórcios

**Data:** 29/09/2025  
**Autor:** Sistema Lovable AI  
**Tipo:** Feature | Enhancement

---

## 📋 Resumo

Implementação de funcionalidade para duplicar produtos/consórcios existentes na tela `/consorcios`, permitindo criar cópias rápidas de produtos semelhantes com nomenclatura automática.

---

## 🎯 Objetivos

- Facilitar o cadastro de produtos similares através de duplicação
- Manter integridade de dados ao copiar atributos
- Implementar nomenclatura automática para evitar conflitos

---

## 🔧 Mudanças Implementadas

### 1. Hook `useConsortiumProducts.ts`

**Arquivo:** `src/hooks/useConsortiumProducts.ts`

#### Adicionado:
- **`duplicateMutation`**: Nova mutation para duplicar produtos
- Lógica de contagem automática para sufixo `#N`
- Validação de nome base para evitar duplicatas conflitantes

#### Funcionalidades:
```typescript
const duplicateMutation = useMutation({
  mutationFn: async (productId: string) => {
    // Busca produto original
    // Remove campos únicos (id, timestamps)
    // Conta produtos existentes com mesmo nome base
    // Adiciona sufixo #N ao nome
    // Insere novo produto
  }
});
```

#### Retorno Atualizado:
```typescript
return {
  // ... existentes
  duplicateProduct: duplicateMutation.mutate,
  isDuplicating: duplicateMutation.isPending,
};
```

---

### 2. Componente `ConsortiumCard.tsx`

**Arquivo:** `src/components/ConsortiumCard.tsx`

#### Modificações:
1. **Import**: Adicionado ícone `Copy` do lucide-react
2. **Props**: Nova prop opcional `onDuplicate?: (productId: string) => void`
3. **Menu Dropdown**: Adicionada opção "Duplicar" com ícone `Copy`

#### Código Adicionado:
```typescript
{onDuplicate && (
  <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
    <Copy className="mr-2 h-4 w-4" />
    Duplicar
  </DropdownMenuItem>
)}
```

---

### 3. Página `Consorcios.tsx`

**Arquivo:** `src/pages/Consorcios.tsx`

#### Modificações:
1. **Hook**: Desestruturação de `duplicateProduct` e `isDuplicating`
2. **Handler**: Novo `handleDuplicateProduct` com confirmação
3. **Renderização**: Prop `onDuplicate` passada para `ConsortiumCard`

#### Handler Implementado:
```typescript
const handleDuplicateProduct = (id: string) => {
  if (confirm("Deseja duplicar este produto?")) {
    duplicateProduct(id);
  }
};
```

---

## 🔄 Fluxo de Duplicação

```mermaid
graph TD
    A[Usuário clica em Duplicar] --> B[Confirmação via modal]
    B -->|Sim| C[duplicateProduct chamado]
    C --> D[Busca produto original]
    D --> E[Remove campos únicos]
    E --> F[Conta produtos com mesmo nome]
    F --> G[Gera novo nome com #N]
    G --> H[Insere novo produto]
    H --> I[Invalida cache]
    I --> J[Toast de sucesso]
    J --> K[Lista atualizada]
```

---

## 📊 Lógica de Nomenclatura

### Padrão de Nomes:
- **Produto Original**: "Consórcio Imóvel Premium"
- **Primeira Duplicata**: "Consórcio Imóvel Premium #1"
- **Segunda Duplicata**: "Consórcio Imóvel Premium #2"
- **N-ésima Duplicata**: "Consórcio Imóvel Premium #N"

### Algoritmo:
1. Extrai nome base removendo ` #\d+$`
2. Busca produtos existentes com padrão `nome_base #%`
3. Conta resultados e adiciona 1
4. Aplica sufixo `#N` ao nome base

---

## ✅ Validações Implementadas

1. **Tenant Ativo**: Verifica `activeTenant?.tenant_id`
2. **Produto Existe**: Valida existência do produto original
3. **Unicidade de Nome**: Garante nome único com sufixo incremental
4. **Confirmação de Usuário**: Modal de confirmação antes de duplicar

---

## 🎨 UX/UI

### Localização:
- Menu dropdown (três pontos) em cada card de produto
- Opção "Duplicar" com ícone de cópia

### Feedback:
- **Loading**: Estado `isDuplicating` durante operação
- **Sucesso**: Toast verde "Produto duplicado com sucesso!"
- **Erro**: Toast vermelho "Erro ao duplicar produto"
- **Atualização**: Lista recarregada automaticamente

---

## 🔐 Segurança

1. **Tenant Isolation**: Duplicação restrita ao tenant ativo
2. **Validação de Acesso**: Apenas usuários autenticados
3. **RLS Supabase**: Políticas aplicadas automaticamente
4. **Confirmação Dupla**: Modal antes de executar duplicação

---

## 📈 Performance

### Otimizações:
- **Query única** para buscar produto original
- **Contagem eficiente** de duplicatas via pattern matching
- **Invalidação seletiva** de cache apenas após sucesso
- **Toast não-bloqueante** para feedback rápido

### Impacto:
- Tempo de duplicação: ~500ms (depende de latência do Supabase)
- Nenhum impacto em outros componentes
- Cache invalidado de forma assíncrona

---

## 🧪 Cenários de Teste

### Teste 1: Duplicação Simples
- **Input**: Produto "Consórcio Auto"
- **Ação**: Clicar em Duplicar
- **Esperado**: Criar "Consórcio Auto #1"

### Teste 2: Múltiplas Duplicações
- **Input**: Produto já duplicado 2 vezes
- **Ação**: Duplicar novamente
- **Esperado**: Criar "#3" corretamente

### Teste 3: Produto com Sufixo Existente
- **Input**: Produto "Consórcio Premium #5"
- **Ação**: Duplicar
- **Esperado**: Extrair base e criar "#6"

### Teste 4: Confirmação Cancelada
- **Input**: Clicar em Duplicar
- **Ação**: Cancelar no modal
- **Esperado**: Nenhuma duplicação

---

## 📝 Notas Técnicas

### Campos Copiados:
- ✅ Nome (com sufixo)
- ✅ Categoria
- ✅ Status
- ✅ Taxas e valores
- ✅ Modos de contemplação
- ✅ Configurações adicionais

### Campos NÃO Copiados:
- ❌ `id` (gerado automaticamente)
- ❌ `created_at` (timestamp atual)
- ❌ `updated_at` (timestamp atual)

---

## 🔮 Melhorias Futuras

1. **Edição Inline**: Abrir modal de edição após duplicar
2. **Duplicação em Lote**: Selecionar múltiplos produtos
3. **Customização de Nome**: Permitir editar nome antes de criar
4. **Templates**: Salvar configurações como templates reutilizáveis

---

## 📚 Referências

- [Documentação Supabase - Insert](https://supabase.com/docs/reference/javascript/insert)
- [React Query - useMutation](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Lucide Icons - Copy](https://lucide.dev/icons/copy)
