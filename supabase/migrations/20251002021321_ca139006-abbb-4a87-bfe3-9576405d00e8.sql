-- Adicionar colunas em test_cases
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS context TEXT;

-- Adicionar colunas em test_executions
ALTER TABLE test_executions 
ADD COLUMN IF NOT EXISTS guardrail_results JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cognitive_analysis JSONB DEFAULT '{}'::jsonb;

-- Adicionar campos de versioning em agents
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS knowledge_base TEXT,
ADD COLUMN IF NOT EXISTS training_examples JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES agents(id);

-- Criar tabela agreement_analysis
CREATE TABLE IF NOT EXISTS agreement_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  benchmark_id UUID REFERENCES benchmarks(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  agent_ids UUID[] NOT NULL,
  kappa_score NUMERIC(4,3),
  interpretation TEXT CHECK (interpretation IN ('poor', 'slight', 'fair', 'moderate', 'substantial', 'almost_perfect')),
  consensus_category TEXT,
  disagreement_level TEXT CHECK (disagreement_level IN ('none', 'low', 'medium', 'high')),
  requires_human_review BOOLEAN DEFAULT false,
  human_review_completed BOOLEAN DEFAULT false,
  human_review_notes TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_agreement_workspace ON agreement_analysis(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agreement_benchmark ON agreement_analysis(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_agreement_requires_review ON agreement_analysis(requires_human_review);

-- Habilitar RLS
ALTER TABLE agreement_analysis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para agreement_analysis
CREATE POLICY "Users can view agreement analysis in their workspace"
  ON agreement_analysis FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage agreement analysis in their workspace"
  ON agreement_analysis FOR ALL
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

-- Criar tabela agent_improvements
CREATE TABLE IF NOT EXISTS agent_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  improvement_type TEXT NOT NULL CHECK (
    improvement_type IN ('prompt_update', 'knowledge_base_addition', 'training_example', 'config_change')
  ),
  before_value TEXT,
  after_value TEXT,
  reason TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by UUID REFERENCES auth.users(id),
  impact_metrics JSONB DEFAULT '{}'::jsonb
);

-- Índices para agent_improvements
CREATE INDEX IF NOT EXISTS idx_improvements_agent ON agent_improvements(agent_id);
CREATE INDEX IF NOT EXISTS idx_improvements_workspace ON agent_improvements(workspace_id);

-- Habilitar RLS
ALTER TABLE agent_improvements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para agent_improvements
CREATE POLICY "Users can view improvements in their workspace"
  ON agent_improvements FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage improvements in their workspace"
  ON agent_improvements FOR ALL
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );