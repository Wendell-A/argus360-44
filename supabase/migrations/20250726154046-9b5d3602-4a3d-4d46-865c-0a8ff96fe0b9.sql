-- Corrigir política RLS da tabela invitations que pode estar causando erro de permissão
-- O problema pode estar na política que faz referência à tabela auth.users

-- Primeiro, vamos revisar e corrigir a política que pode estar causando problema
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.invitations;

-- Recriar a política sem referenciar auth.users diretamente
CREATE POLICY "Users can view invitations sent to their email"
ON public.invitations 
FOR SELECT 
USING (
  -- Permitir que usuários vejam convites enviados para seu email
  -- usando a função get_authenticated_user_data() que é mais segura
  email IN (
    SELECT jsonb_extract_path_text(get_authenticated_user_data(), 'email')
    WHERE jsonb_extract_path_text(get_authenticated_user_data(), 'authenticated')::boolean = true
  )
);

-- Adicionar política mais específica para owners/admins gerenciarem convites
DROP POLICY IF EXISTS "Owners can manage invitations" ON public.invitations;

CREATE POLICY "Owners and admins can manage invitations"
ON public.invitations 
FOR ALL 
USING (
  get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role])
);

-- Política para inserir convites (owners e admins podem criar)
CREATE POLICY "Owners and admins can create invitations"
ON public.invitations 
FOR INSERT 
WITH CHECK (
  get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role])
);