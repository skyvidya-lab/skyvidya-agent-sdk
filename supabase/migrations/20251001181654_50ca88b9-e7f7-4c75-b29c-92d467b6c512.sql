-- =====================================================
-- SPRINT 1: Quality & Benchmark Center - Database Schema
-- =====================================================

-- Table: test_cases - Casos de Teste
CREATE TABLE public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  expected_score_min NUMERIC DEFAULT 85,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: test_executions - Execuções de Testes
CREATE TABLE public.test_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id UUID NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  question_asked TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  actual_answer TEXT,
  similarity_score NUMERIC,
  factual_accuracy NUMERIC,
  relevance_score NUMERIC,
  tokens_used INTEGER,
  latency_ms INTEGER,
  cost_usd NUMERIC,
  validation_justification TEXT,
  cognitive_gaps JSONB DEFAULT '[]',
  improvement_suggestions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'warning')),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table: benchmarks - Comparações entre Agentes
CREATE TABLE public.benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  agent_ids UUID[] NOT NULL DEFAULT '{}',
  test_case_ids UUID[] NOT NULL DEFAULT '{}',
  results JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: cognitive_insights - Insights de IA
CREATE TABLE public.cognitive_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('gap', 'pattern', 'recommendation')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_test_cases_workspace ON public.test_cases(workspace_id);
CREATE INDEX idx_test_cases_agent ON public.test_cases(agent_id);
CREATE INDEX idx_test_cases_category ON public.test_cases(category);
CREATE INDEX idx_test_executions_workspace ON public.test_executions(workspace_id);
CREATE INDEX idx_test_executions_agent ON public.test_executions(agent_id);
CREATE INDEX idx_test_executions_test_case ON public.test_executions(test_case_id);
CREATE INDEX idx_test_executions_status ON public.test_executions(status);
CREATE INDEX idx_benchmarks_workspace ON public.benchmarks(workspace_id);
CREATE INDEX idx_cognitive_insights_workspace ON public.cognitive_insights(workspace_id);
CREATE INDEX idx_cognitive_insights_agent ON public.cognitive_insights(agent_id);

-- Triggers for updated_at
CREATE TRIGGER update_test_cases_updated_at
  BEFORE UPDATE ON public.test_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_cases
CREATE POLICY "Users can view test cases in their workspace"
  ON public.test_cases FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage test cases in their workspace"
  ON public.test_cases FOR ALL
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

-- RLS Policies for test_executions
CREATE POLICY "Users can view test executions in their workspace"
  ON public.test_executions FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "System can insert test executions"
  ON public.test_executions FOR INSERT
  WITH CHECK (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage test executions in their workspace"
  ON public.test_executions FOR ALL
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

-- RLS Policies for benchmarks
CREATE POLICY "Users can view benchmarks in their workspace"
  ON public.benchmarks FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage benchmarks in their workspace"
  ON public.benchmarks FOR ALL
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

-- RLS Policies for cognitive_insights
CREATE POLICY "Users can view insights in their workspace"
  ON public.cognitive_insights FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "System can insert insights"
  ON public.cognitive_insights FOR INSERT
  WITH CHECK (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can manage insights in their workspace"
  ON public.cognitive_insights FOR ALL
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );