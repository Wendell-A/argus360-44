# Alteração: Aplicação de Mascaramento Obrigatório nas Listagens (Clientes)

Data/Hora: 02/10/2025 23:06 UTC
Responsável: Automação Lovable

## Objetivo
Garantir que dados sensíveis de clientes (CPF/CNPJ, email e telefones) sejam SEMPRE exibidos mascarados nas telas de listagem, independentemente do papel do usuário, conforme LGPD (fase 2).

## Mudanças Realizadas

1) Backend (Supabase)
- Recriada a view `public.clients_masked` com mascaramento obrigatório usando as funções `public.mask_document`, `public.mask_email` e `public.mask_phone`.
- Recriadas as views `public.profiles_masked` e `public.tenant_users_masked` para padronizar mascaramento de usuários em listagens.

2) Frontend
- Página `src/pages/Clientes.tsx`
  - Troca do hook: de `useClients()` para `useClientsMasked()` para garantir mascaramento no frontend mesmo que o backend seja alterado futuramente.

## Escopo Preservado
- Nenhum dado existente foi modificado na base.
- Hooks de criação/edição/exclusão de clientes permanecem inalterados.

## Validação Rápida
- Acessar /clientes → coluna Contato e Documento devem exibir valores mascarados (e.g., `p*****o@dominio.com`, `(11) ****-7664`, `123.***.***-45`).

## Observações Técnicas
- React Query: a chave permanece `['clients', tenant_id]` no hook antigo; `useClientsMasked()` utiliza `['clients-masked', tenant_id]`. Em caso de cache antigo, forçar um refresh da página.

## Próximos Passos
- Revisar telas de Vendas e Vendedores para adoção de `profiles_masked`/`tenant_users_masked` e garantir que todas as listagens usem views mascaradas.
