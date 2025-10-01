-- Fase 1: Adicionar políticas públicas para visualização de tenants e configs

-- Policy para visualização pública de tenants ativos
CREATE POLICY "Anyone can view active tenants"
ON public.tenants
FOR SELECT
USING (is_active = true);

-- Policy para visualização pública de configurações de tenants ativos
CREATE POLICY "Anyone can view tenant configs"
ON public.tenant_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tenants 
    WHERE tenants.id = tenant_config.tenant_id 
    AND tenants.is_active = true
  )
);