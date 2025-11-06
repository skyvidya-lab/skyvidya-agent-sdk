-- Fase 1: Modificar tabela agents para suportar agentes globais
ALTER TABLE agents 
  ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE agents
  ADD COLUMN is_global boolean DEFAULT false;

COMMENT ON COLUMN agents.tenant_id IS 
  'Tenant proprietário do agente. NULL para agentes globais que podem ser compartilhados';

COMMENT ON COLUMN agents.is_global IS 
  'Indica se o agente é global e pode ser compartilhado entre múltiplos workspaces';

-- Fase 2: Criar tabela workspace_agents (relacionamento many-to-many)
CREATE TABLE workspace_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  custom_config jsonb DEFAULT '{}'::jsonb,
  enabled_at timestamp with time zone DEFAULT now(),
  enabled_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(workspace_id, agent_id)
);

CREATE INDEX idx_workspace_agents_workspace ON workspace_agents(workspace_id);
CREATE INDEX idx_workspace_agents_agent ON workspace_agents(agent_id);
CREATE INDEX idx_workspace_agents_enabled ON workspace_agents(workspace_id, enabled);

COMMENT ON TABLE workspace_agents IS 
  'Tabela de relacionamento many-to-many entre workspaces e agentes. Permite que um agente seja habilitado em múltiplos workspaces';

-- Fase 3: RLS Policies para workspace_agents
ALTER TABLE workspace_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace agents"
  ON workspace_agents FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage workspace agents"
  ON workspace_agents FOR ALL
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

-- Fase 4: Atualizar RLS policies de agents para suportar agentes globais
CREATE POLICY "Everyone can view global agents"
  ON agents FOR SELECT
  USING (is_global = true);

-- Fase 5: Migração de dados existentes
-- Habilita automaticamente todos os agentes existentes nos seus workspaces atuais
INSERT INTO workspace_agents (workspace_id, agent_id, enabled, enabled_by)
SELECT tenant_id, id, true, created_by
FROM agents
WHERE tenant_id IS NOT NULL
ON CONFLICT (workspace_id, agent_id) DO NOTHING;