-- Remover política redundante de SELECT
DROP POLICY IF EXISTS "Users can view config of their tenants" ON public.tenant_config;

-- Remover política ALL e substituir por políticas específicas
DROP POLICY IF EXISTS "Tenant admins can update their config" ON public.tenant_config;

-- Criar políticas específicas para admins
CREATE POLICY "Tenant admins can insert config"
ON public.tenant_config
FOR INSERT
TO public
WITH CHECK (
  has_role(auth.uid(), tenant_id, 'tenant_admin'::app_role) 
  OR has_role(auth.uid(), tenant_id, 'super_admin'::app_role)
);

CREATE POLICY "Tenant admins can update config"
ON public.tenant_config
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), tenant_id, 'tenant_admin'::app_role) 
  OR has_role(auth.uid(), tenant_id, 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), tenant_id, 'tenant_admin'::app_role) 
  OR has_role(auth.uid(), tenant_id, 'super_admin'::app_role)
);

CREATE POLICY "Tenant admins can delete config"
ON public.tenant_config
FOR DELETE
TO public
USING (
  has_role(auth.uid(), tenant_id, 'tenant_admin'::app_role) 
  OR has_role(auth.uid(), tenant_id, 'super_admin'::app_role)
);