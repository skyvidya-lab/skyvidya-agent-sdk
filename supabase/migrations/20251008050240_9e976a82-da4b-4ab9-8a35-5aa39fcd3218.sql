-- Adicionar política de DELETE para agreement_analysis
CREATE POLICY "Admins can delete agreement analysis in their workspace"
ON agreement_analysis
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR
  has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR
  has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
);