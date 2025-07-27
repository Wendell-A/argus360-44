# Correção da Edição de Vendedores - 27/01/2025 14:55

## Problema Identificado
A funcionalidade de edição de vendedores estava apresentando problemas devido a:

1. **Merge Conflicts**: Havia marcadores de merge conflict nos arquivos que impediam a compilação
2. **Estrutura de dados inconsistente**: A forma como os dados eram estruturados na atualização não estava alinhada com o banco de dados
3. **Mapeamento incorreto de campos**: Os campos `office_id` e `team_id` não estavam sendo atualizados corretamente na tabela `tenant_users`

## Problemas Corrigidos

### 1. Merge Conflicts Resolvidos
- **Arquivo**: `src/hooks/useVendedores.ts`
- **Arquivo**: `src/components/VendedorModal.tsx`
- Removidos todos os marcadores `<<<<<<< HEAD`, `=======`, e `>>>>>>> hash`

### 2. Estrutura de Dados Corrigida no useVendedores.ts
- **Função updateVendedorMutation**: Corrigida para enviar dados no formato correto
- **Campo hierarchical_level**: Ajustado para usar o nome correto da coluna do banco
- **Atualização tenant_users**: Adicionada lógica para atualizar `office_id` e `team_id` na tabela `tenant_users`

### 3. Formulário VendedorModal.tsx
- **Inicialização do formulário**: Corrigida para usar `vendedor.settings?.campo` para valores específicos
- **Estrutura updateData**: Ajustada para enviar dados no formato esperado pelo hook
- **Tratamento de team_id**: Adicionado tratamento especial para o valor 'no-team'

## Alterações Técnicas Realizadas

### Hook useVendedores.ts
```typescript
// Antes (com merge conflicts)
<<<<<<< HEAD
commission_rate: data.commission_rate,
hierarchy_level: data.hierarchy_level,
=======
hierarchical_level: data.hierarchical_level,
settings: data.settings
>>>>>>> hash

// Depois (corrigido)
hierarchical_level: data.hierarchical_level,
settings: data.settings
```

### Atualização tenant_users
```typescript
// Adicionado
if (data.office_id !== undefined || data.team_id !== undefined) {
  const { error: tenantUserError } = await supabase
    .from("tenant_users")
    .update({ 
      office_id: data.office_id || null,
      team_id: data.team_id === 'no-team' ? null : data.team_id
    })
    .eq("user_id", id)
    .eq("tenant_id", activeTenant.tenant_id);
}
```

### Modal VendedorModal.tsx
```typescript
// Estrutura de dados corrigida para update
const updateData = {
  full_name: vendedor.full_name,
  email: vendedor.email,
  phone: formData.whatsapp,
  department: vendedor.department,
  position: vendedor.position,
  hierarchical_level: formData.hierarchy_level,
  office_id: formData.office_id,
  team_id: formData.team_id === 'no-team' ? null : formData.team_id,
  settings: {
    ...vendedor.settings,
    commission_rate: formData.commission_rate,
    sales_goal: formData.sales_goal,
    whatsapp: formData.whatsapp,
    specialties: formData.specialties,
    notes: formData.notes,
    active: formData.active,
  },
};
```

## Funcionalidades Restauradas
1. ✅ **Edição de vendedores**: Agora funciona corretamente
2. ✅ **Atualização de escritório**: office_id é atualizado em tenant_users
3. ✅ **Atualização de equipe**: team_id é atualizado em tenant_users
4. ✅ **Atualização de configurações**: Todos os campos do settings são preservados
5. ✅ **Compilação**: Sistema compila sem erros

## Banco de Dados Impactado
- **Tabela**: `profiles` - dados do vendedor
- **Tabela**: `tenant_users` - associação com escritório e equipe
- **Campos atualizados**: `office_id`, `team_id`, `hierarchical_level`, `settings`

## Status
✅ **CONCLUÍDO** - Sistema de edição de vendedores funcionando corretamente