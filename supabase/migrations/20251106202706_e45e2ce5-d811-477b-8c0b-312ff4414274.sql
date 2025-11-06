-- Corrigir workspaces existentes: adicionar super_admin role para o dono de cada workspace
-- Isso garante que todos os workspaces criados no passado tenham pelo menos uma role associada

INSERT INTO user_roles (user_id, tenant_id, role)
SELECT DISTINCT
  'dec48185-a6ec-499d-9cfe-3330667fdf77'::uuid as user_id,
  t.id as tenant_id,
  'super_admin'::app_role as role
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.tenant_id = t.id 
  AND ur.user_id = 'dec48185-a6ec-499d-9cfe-3330667fdf77'::uuid
)
AND t.is_active = true;