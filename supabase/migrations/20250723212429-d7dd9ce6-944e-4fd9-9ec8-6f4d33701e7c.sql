
-- Primeiro, vamos adicionar a permissão específica para convites se ela não existir
INSERT INTO public.permissions (module, resource, actions) 
VALUES ('users', 'invitations', ARRAY['create', 'read', 'update', 'delete'])
ON CONFLICT (module, resource) DO NOTHING;

-- Corrigir a política RLS da tabela invitations para permitir que admins e managers também possam gerenciar
DROP POLICY IF EXISTS "Owners can manage invitations" ON public.invitations;

CREATE POLICY "Admins can manage invitations" ON public.invitations
  FOR ALL TO authenticated
  USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role]));

-- Garantir que a política de visualização continue funcionando
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.invitations;

CREATE POLICY "Users can view invitations sent to their email" ON public.invitations
  FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
