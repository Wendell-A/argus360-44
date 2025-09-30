-- Criar tabela defaulters
CREATE TABLE IF NOT EXISTS public.defaulters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  empresa TEXT,
  cod_revenda TEXT,
  ata TEXT,
  revenda TEXT,
  data_contabilizacao DATE,
  data_alocacao DATE,
  proposta TEXT,
  cod_grupo TEXT,
  cota INTEGER,
  sequencia INTEGER,
  cliente_nome TEXT,
  tipo_cota TEXT,
  bem_descricao TEXT,
  prazo_cota_meses INTEGER,
  parcelas_pagas INTEGER,
  parcelas_vencidas INTEGER,
  status_cota TEXT,
  situacao_cobranca TEXT,
  valor_bem_venda NUMERIC(15, 2),
  valor_bem_atual NUMERIC(15, 2),
  telefone TEXT,
  data_atualizacao TIMESTAMPTZ,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para otimização
CREATE INDEX idx_defaulters_tenant_id ON public.defaulters(tenant_id);
CREATE INDEX idx_defaulters_proposta ON public.defaulters(proposta);
CREATE INDEX idx_defaulters_cliente_nome ON public.defaulters(cliente_nome);
CREATE INDEX idx_defaulters_situacao_cobranca ON public.defaulters(situacao_cobranca);
CREATE INDEX idx_defaulters_sale_id ON public.defaulters(sale_id);

-- Habilitar Row Level Security
ALTER TABLE public.defaulters ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: usuários podem ver apenas inadimplentes do seu tenant
CREATE POLICY "Users can view defaulters in their tenants"
ON public.defaulters
FOR SELECT
USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

-- Política de INSERT: apenas admin/manager podem inserir
CREATE POLICY "Admins and managers can insert defaulters"
ON public.defaulters
FOR INSERT
WITH CHECK (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) = ANY(ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role])
);

-- Política de UPDATE: apenas admin/manager podem atualizar
CREATE POLICY "Admins and managers can update defaulters"
ON public.defaulters
FOR UPDATE
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) = ANY(ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role])
);

-- Política de DELETE: apenas admin/owner podem deletar
CREATE POLICY "Admins and owners can delete defaulters"
ON public.defaulters
FOR DELETE
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) = ANY(ARRAY['owner'::user_role, 'admin'::user_role])
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_defaulters_updated_at
  BEFORE UPDATE ON public.defaulters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função RPC para listagem paginada de inadimplentes
CREATE OR REPLACE FUNCTION public.get_defaulters_list(
  p_page_number INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10,
  p_search_term TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT NULL,
  p_situacao_filter TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total_count INTEGER;
  v_data JSONB;
  v_tenant_ids UUID[];
BEGIN
  -- Calcular offset
  v_offset := (p_page_number - 1) * p_page_size;
  
  -- Obter tenant_ids do usuário autenticado
  v_tenant_ids := get_user_tenant_ids(auth.uid());
  
  -- Contar total de registros que correspondem aos filtros
  SELECT COUNT(*)
  INTO v_total_count
  FROM public.defaulters d
  WHERE d.tenant_id = ANY(v_tenant_ids)
    AND (p_search_term IS NULL OR 
         d.cliente_nome ILIKE '%' || p_search_term || '%' OR
         d.proposta ILIKE '%' || p_search_term || '%')
    AND (p_status_filter IS NULL OR d.status_cota = p_status_filter)
    AND (p_situacao_filter IS NULL OR d.situacao_cobranca = p_situacao_filter);
  
  -- Buscar dados paginados
  SELECT COALESCE(jsonb_agg(row_to_json(d.*)), '[]'::jsonb)
  INTO v_data
  FROM (
    SELECT d.*
    FROM public.defaulters d
    WHERE d.tenant_id = ANY(v_tenant_ids)
      AND (p_search_term IS NULL OR 
           d.cliente_nome ILIKE '%' || p_search_term || '%' OR
           d.proposta ILIKE '%' || p_search_term || '%')
      AND (p_status_filter IS NULL OR d.status_cota = p_status_filter)
      AND (p_situacao_filter IS NULL OR d.situacao_cobranca = p_situacao_filter)
    ORDER BY d.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) d;
  
  -- Retornar resultado com dados e total
  RETURN jsonb_build_object(
    'data', v_data,
    'total_count', v_total_count
  );
END;
$$;