-- Criar tabela para links de convite público
CREATE TABLE public.public_invitation_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_by UUID NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'user',
  office_id UUID,
  department_id UUID,
  team_id UUID,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_public_invitation_links_token ON public.public_invitation_links(token);
CREATE INDEX idx_public_invitation_links_tenant ON public.public_invitation_links(tenant_id);
CREATE INDEX idx_public_invitation_links_active ON public.public_invitation_links(is_active, expires_at);

-- RLS Policies
ALTER TABLE public.public_invitation_links ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar links públicos
CREATE POLICY "Admins can manage public invitation links" 
ON public.public_invitation_links 
FOR ALL
USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY(ARRAY['owner'::user_role, 'admin'::user_role]));

-- Qualquer pessoa pode visualizar links ativos e válidos (para validação de token)
CREATE POLICY "Anyone can view valid public links for validation" 
ON public.public_invitation_links 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_public_invitation_token()
RETURNS VARCHAR(64)
LANGUAGE plpgsql
AS $$
DECLARE
  token_value VARCHAR(64);
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar token de 32 caracteres
    token_value := encode(gen_random_bytes(24), 'base64');
    token_value := replace(replace(replace(token_value, '/', ''), '+', ''), '=', '');
    token_value := substr(token_value, 1, 32);
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.public_invitation_links WHERE token = token_value) INTO token_exists;
    
    IF NOT token_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token_value;
END;
$$;

-- Função para validar token público
CREATE OR REPLACE FUNCTION validate_public_invitation_token(p_token VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  result JSONB;
BEGIN
  -- Buscar link válido
  SELECT * INTO link_record
  FROM public.public_invitation_links
  WHERE token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Link de convite inválido ou expirado'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'link_data', row_to_json(link_record)
  );
END;
$$;

-- Função para aceitar convite público
CREATE OR REPLACE FUNCTION accept_public_invitation(
  p_token VARCHAR,
  p_user_id UUID,
  p_email VARCHAR,
  p_full_name VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  link_record public.public_invitation_links%ROWTYPE;
  result JSONB;
BEGIN
  -- Validar token
  SELECT validation_result.link_data::JSONB INTO link_record
  FROM (SELECT validate_public_invitation_token(p_token) as validation_result) AS validation_result
  WHERE (validation_result.validation_result->>'valid')::BOOLEAN = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Link de convite inválido ou expirado'
    );
  END IF;

  -- Buscar dados do link novamente para ter a estrutura correta
  SELECT * INTO link_record
  FROM public.public_invitation_links
  WHERE token = p_token;

  -- Verificar se usuário já está no tenant
  IF EXISTS(SELECT 1 FROM public.tenant_users WHERE user_id = p_user_id AND tenant_id = link_record.tenant_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário já faz parte desta organização'
    );
  END IF;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, p_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Criar associação tenant_user
  INSERT INTO public.tenant_users (
    user_id,
    tenant_id,
    role,
    office_id,
    department_id,
    team_id,
    active,
    joined_at
  ) VALUES (
    p_user_id,
    link_record.tenant_id,
    link_record.role,
    link_record.office_id,
    link_record.department_id,
    link_record.team_id,
    true,
    now()
  );

  -- Incrementar contador de usos
  UPDATE public.public_invitation_links
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = link_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', link_record.tenant_id,
    'role', link_record.role,
    'message', 'Cadastro realizado com sucesso'
  );
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_public_invitation_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_public_invitation_links_updated_at
  BEFORE UPDATE ON public.public_invitation_links
  FOR EACH ROW
  EXECUTE FUNCTION update_public_invitation_links_updated_at();