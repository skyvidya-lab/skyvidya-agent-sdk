-- Remover política antiga de visualização de tenants
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;

-- Criar nova política que permite super admins verem todos os tenants
CREATE POLICY "Users can view their tenants or super admins see all"
ON tenants
FOR SELECT
USING (
  -- Usuário tem acesso ao tenant através de user_roles
  has_tenant_access(auth.uid(), id)
  OR
  -- Usuário é super_admin em QUALQUER tenant
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'::app_role
  )
);

-- Adicionar constraint de unicidade no slug para evitar duplicatas
ALTER TABLE tenants 
ADD CONSTRAINT unique_tenant_slug UNIQUE (slug);