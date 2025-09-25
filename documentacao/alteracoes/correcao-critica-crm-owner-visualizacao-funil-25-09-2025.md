# Correção Crítica CRM – Owner não visualiza todos clientes no Funil de Vendas

Data/Hora: 25/09/2025 14:45 (UTC-03)

## Problema
Mesmo com RLS corrigido no banco, o usuário Owner não via o cliente "Vagner Amorin" no Funil de Vendas. Logs do componente indicavam `userRole: 'user'`, levando o filtro de segurança a ocultar clientes não próprios.

## Causa Raiz
O papel do usuário estava sendo coletado do `office_users.role` no hook `useCurrentUser`, que não é a fonte de verdade para o papel no tenant. Em muitos casos, `office_users` continha `role = 'user'`, mascarando o papel real do usuário em `tenant_users` (ex.: `owner`).

## Solução Aplicada
1. Hook `useCurrentUser`
   - Passou a buscar o papel no `tenant_users` (fonte de verdade) com `maybeSingle()`.
   - Resolve o escritório a partir de `tenant_users.office_id` (quando existir).
   - Mantido fallback para `office_users` apenas se não houver registro em `tenant_users`.
2. Componente `SalesFunnelBoardSecure`
   - Banner de visualização agora reflete o escopo real:
     - Owner/Admin: "Visualização global do tenant – Mostrando todos os clientes".
     - Manager: "Visualização de escritório – Mostrando clientes dos seus escritórios".
     - User/Viewer: "Visualização segura – Mostrando apenas seus clientes".
   - Mantida a regra de acesso já implementada: Owner/Admin sempre têm acesso a todos os clientes do tenant.

## Arquivos Alterados
- src/hooks/useCurrentUser.ts
- src/components/crm/SalesFunnelBoardSecure.tsx

## Impacto e Validações
- Owner agora enxerga todos os clientes no funil, inclusive "Vagner Amorin".
- Manager e User/Viewer continuam com acesso contextual preservado.
- Não houve impacto nas demais telas/funcionalidades.

## Notas Técnicas
- Uso de `.maybeSingle()` para evitar erros quando não há linha correspondente.
- Mantida compatibilidade com a estrutura existente e políticas RLS vigentes.

---
Responsável: Lovable AI
