-- Fase 0: Criar tabela improvement_reports com campos HIL

CREATE TABLE IF NOT EXISTS public.improvement_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('knowledge_base', 'system_prompt')),
  
  -- Metadados da análise
  analysis_period_start TIMESTAMPTZ,
  analysis_period_end TIMESTAMPTZ,
  failed_executions_analyzed INTEGER NOT NULL,
  min_score_threshold NUMERIC,
  
  -- Conteúdo do relatório (gerado pela IA)
  summary TEXT,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  full_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Human-in-the-Loop (HIL)
  review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    review_status IN ('pending_review', 'under_review', 'approved', 'rejected', 'requires_changes')
  ),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  original_recommendations JSONB, -- Backup das recomendações originais antes de edição humana
  human_edited BOOLEAN DEFAULT FALSE,
  
  -- Controle de aplicação
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id),
  
  -- Auditoria
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_improvement_reports_workspace 
  ON public.improvement_reports(workspace_id, generated_at DESC);
  
CREATE INDEX idx_improvement_reports_agent 
  ON public.improvement_reports(agent_id, generated_at DESC);
  
CREATE INDEX idx_improvement_reports_status 
  ON public.improvement_reports(workspace_id, review_status, generated_at DESC);
  
CREATE INDEX idx_improvement_reports_pending 
  ON public.improvement_reports(workspace_id, review_status) 
  WHERE review_status = 'pending_review';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_improvement_reports_updated_at
  BEFORE UPDATE ON public.improvement_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para rastrear edições humanas
CREATE OR REPLACE FUNCTION public.track_report_edits()
RETURNS TRIGGER AS $$
BEGIN
  -- Se as recomendações foram modificadas e ainda não foram salvas como originais
  IF NEW.recommendations IS DISTINCT FROM OLD.recommendations AND OLD.original_recommendations IS NULL THEN
    NEW.original_recommendations = OLD.recommendations;
    NEW.human_edited = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_improvement_report_edits
  BEFORE UPDATE ON public.improvement_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.track_report_edits();

-- Enable RLS
ALTER TABLE public.improvement_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reports in their workspace"
  ON public.improvement_reports 
  FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert reports in their workspace"
  ON public.improvement_reports 
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

CREATE POLICY "Admins can update reports in their workspace"
  ON public.improvement_reports 
  FOR UPDATE
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );

CREATE POLICY "Admins can delete reports in their workspace"
  ON public.improvement_reports 
  FOR DELETE
  USING (
    has_role(auth.uid(), workspace_id, 'tenant_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'super_admin'::app_role) OR 
    has_role(auth.uid(), workspace_id, 'agent_manager'::app_role)
  );