-- Fase 1: Estrutura de Banco de Dados para Validação de Segurança

-- Adicionar campos de segurança na tabela test_cases existente
ALTER TABLE public.test_cases 
ADD COLUMN IF NOT EXISTS test_type text DEFAULT 'functional',
ADD COLUMN IF NOT EXISTS severity text,
ADD COLUMN IF NOT EXISTS attack_category text,
ADD COLUMN IF NOT EXISTS detection_patterns jsonb DEFAULT '[]'::jsonb;

-- Criar índices para performance em test_cases
CREATE INDEX IF NOT EXISTS idx_test_cases_test_type ON public.test_cases(test_type);
CREATE INDEX IF NOT EXISTS idx_test_cases_severity ON public.test_cases(severity);
CREATE INDEX IF NOT EXISTS idx_test_cases_attack_category ON public.test_cases(attack_category);

-- Criar tabela security_test_executions
CREATE TABLE IF NOT EXISTS public.security_test_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  test_case_id uuid NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
  executed_at timestamp with time zone DEFAULT now(),
  executed_by uuid,
  
  -- Dados da execução
  question_asked text NOT NULL,
  actual_response text NOT NULL,
  
  -- Análise de segurança
  security_status text NOT NULL, -- 'passed', 'failed', 'warning'
  vulnerability_detected boolean DEFAULT false,
  attack_patterns_matched jsonb DEFAULT '[]'::jsonb,
  risk_level text, -- 'critical', 'high', 'medium', 'low'
  
  -- Análise detalhada
  detection_details jsonb DEFAULT '{}'::jsonb,
  false_positive boolean DEFAULT false,
  human_reviewed boolean DEFAULT false,
  human_review_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  
  -- Metadados
  tokens_used integer,
  latency_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices para security_test_executions
CREATE INDEX idx_security_executions_workspace ON public.security_test_executions(workspace_id);
CREATE INDEX idx_security_executions_agent ON public.security_test_executions(agent_id);
CREATE INDEX idx_security_executions_test_case ON public.security_test_executions(test_case_id);
CREATE INDEX idx_security_executions_status ON public.security_test_executions(security_status);
CREATE INDEX idx_security_executions_vulnerability ON public.security_test_executions(vulnerability_detected);
CREATE INDEX idx_security_executions_executed_at ON public.security_test_executions(executed_at DESC);

-- Criar tabela security_compliance_reports
CREATE TABLE IF NOT EXISTS public.security_compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  generated_at timestamp with time zone DEFAULT now(),
  generated_by uuid,
  
  -- Período de análise
  analysis_period_start timestamp with time zone NOT NULL,
  analysis_period_end timestamp with time zone NOT NULL,
  
  -- Métricas consolidadas
  total_tests integer NOT NULL DEFAULT 0,
  tests_passed integer NOT NULL DEFAULT 0,
  tests_failed integer NOT NULL DEFAULT 0,
  tests_warning integer NOT NULL DEFAULT 0,
  compliance_score numeric(5,2), -- 0-100
  
  -- Análise de vulnerabilidades
  critical_vulnerabilities integer DEFAULT 0,
  high_vulnerabilities integer DEFAULT 0,
  medium_vulnerabilities integer DEFAULT 0,
  low_vulnerabilities integer DEFAULT 0,
  
  -- Análise por categoria
  category_analysis jsonb DEFAULT '{}'::jsonb,
  
  -- Detalhes completos
  executive_summary text,
  vulnerabilities_found jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  lessons_learned jsonb DEFAULT '[]'::jsonb,
  full_report jsonb DEFAULT '{}'::jsonb,
  
  -- Status do relatório
  report_status text DEFAULT 'generated', -- 'generated', 'reviewed', 'archived'
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_notes text,
  
  -- Export
  exported_pdf_url text,
  exported_at timestamp with time zone
);

-- Índices para security_compliance_reports
CREATE INDEX idx_security_reports_workspace ON public.security_compliance_reports(workspace_id);
CREATE INDEX idx_security_reports_agent ON public.security_compliance_reports(agent_id);
CREATE INDEX idx_security_reports_generated_at ON public.security_compliance_reports(generated_at DESC);
CREATE INDEX idx_security_reports_compliance_score ON public.security_compliance_reports(compliance_score);
CREATE INDEX idx_security_reports_status ON public.security_compliance_reports(report_status);

-- RLS para security_test_executions
ALTER TABLE public.security_test_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view security executions in their workspace"
  ON public.security_test_executions
  FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert security executions in their workspace"
  ON public.security_test_executions
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

CREATE POLICY "Admins can update security executions in their workspace"
  ON public.security_test_executions
  FOR UPDATE
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

CREATE POLICY "Admins can delete security executions in their workspace"
  ON public.security_test_executions
  FOR DELETE
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

-- RLS para security_compliance_reports
ALTER TABLE public.security_compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view security reports in their workspace"
  ON public.security_compliance_reports
  FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert security reports in their workspace"
  ON public.security_compliance_reports
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

CREATE POLICY "Admins can update security reports in their workspace"
  ON public.security_compliance_reports
  FOR UPDATE
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

CREATE POLICY "Admins can delete security reports in their workspace"
  ON public.security_compliance_reports
  FOR DELETE
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );