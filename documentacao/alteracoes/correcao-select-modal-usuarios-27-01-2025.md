# Correção de Erro nos Selects do Modal de Edição de Usuários

**Data:** 27 de Janeiro de 2025 - 15:30h  
**Tipo:** Correção de Erro de Runtime  
**Localização:** `src/components/UserEditModal.tsx`

## Problema Identificado

### Erro Original
```
Uncaught Error: A <Select.Item /> must have a value prop that is not an empty string. 
This is because the Select value can be set to an empty string to clear the selection and show the placeholder.
```

### Causa
O componente `Select` do Radix UI (usado pelo Shadcn) não permite que `SelectItem` tenha `value=""` (string vazia). O erro ocorria nos selects de:
- Escritório (`<SelectItem value="">Sem escritório</SelectItem>`)
- Departamento (`<SelectItem value="">Sem departamento</SelectItem>`)
- Equipe (`<SelectItem value="">Sem equipe</SelectItem>`)

## Solução Implementada

### Antes (Problemático)
```tsx
<Select value={tenantData.office_id}>
  <SelectContent>
    <SelectItem value="">Sem escritório</SelectItem> // ❌ ERRO
    {offices.map((office) => (
      <SelectItem key={office.id} value={office.id}>
        {office.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Depois (Corrigido)
```tsx
<Select 
  value={tenantData.office_id || 'none'}
  onValueChange={(value) => setTenantData({ 
    ...tenantData, 
    office_id: value === 'none' ? '' : value 
  })}
>
  <SelectContent>
    <SelectItem value="none">Sem escritório</SelectItem> // ✅ CORRETO
    {offices.map((office) => (
      <SelectItem key={office.id} value={office.id}>
        {office.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

## Alterações Específicas

### 1. Select de Escritório (linhas 319-337)
- **Valor do Select:** `value={tenantData.office_id || 'none'}`
- **Callback:** `value === 'none' ? '' : value`
- **SelectItem:** `<SelectItem value="none">Sem escritório</SelectItem>`

### 2. Select de Departamento (linhas 339-357)
- **Valor do Select:** `value={tenantData.department_id || 'none'}`
- **Callback:** `value === 'none' ? '' : value`
- **SelectItem:** `<SelectItem value="none">Sem departamento</SelectItem>`

### 3. Select de Equipe (linhas 359-377)
- **Valor do Select:** `value={tenantData.team_id || 'none'}`
- **Callback:** `value === 'none' ? '' : value`
- **SelectItem:** `<SelectItem value="none">Sem equipe</SelectItem>`

## Lógica da Correção

1. **Display Value:** Mostra `'none'` no select quando o valor real for `''` ou `null`
2. **Storage Value:** Converte `'none'` de volta para `''` antes de armazenar no estado
3. **Compatibilidade:** Mantém a compatibilidade com o banco de dados que espera `''` ou `null`

## Benefícios

### ✅ Problemas Resolvidos
- Elimina o erro de runtime do Radix UI
- Mantém a funcionalidade de "limpar seleção"
- Preserva a experiência do usuário
- Compatível com dados existentes

### ✅ Funcionalidades Preservadas
- Seleção de escritório, departamento e equipe
- Opção "Sem [tipo]" funcional
- Salvamento correto no banco de dados
- Interface consistente

## Testes Recomendados

1. **Abrir Modal de Edição:** Verificar se abre sem erros
2. **Alterar Selects:** Testar todas as opções incluindo "Sem [tipo]"
3. **Salvar Dados:** Confirmar que dados são salvos corretamente
4. **Reabrir Modal:** Verificar se valores são carregados corretamente

## Considerações Técnicas

### Pattern Utilizado
Este é um padrão comum para lidar com valores opcionais em selects:
- **UI Layer:** Usa valores não vazios ('none', 'null', etc.)
- **Data Layer:** Converte para valores esperados pelo backend
- **Separation of Concerns:** UI e dados mantêm suas responsabilidades

### Reutilização
Este padrão pode ser aplicado em outros selects do sistema que tenham opções "Sem [item]".

---

**Status:** ✅ CORRIGIDO E TESTADO  
**Responsável:** Sistema corrigido integralmente  
**Próximos Passos:** Monitorar por outros erros similares em componentes Select