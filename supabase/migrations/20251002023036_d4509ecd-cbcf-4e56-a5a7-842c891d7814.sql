-- Create batch_executions table for tracking batch test execution progress
CREATE TABLE public.batch_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_ids UUID[] NOT NULL,
  test_case_ids UUID[] NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Progress metrics
  total_tests INTEGER NOT NULL,
  completed_tests INTEGER DEFAULT 0,
  successful_tests INTEGER DEFAULT 0,
  failed_tests INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  
  -- Results
  execution_ids UUID[] DEFAULT '{}',
  error_log JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable realtime for real-time progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch_executions;

-- Create indices for better query performance
CREATE INDEX idx_batch_executions_workspace_id ON public.batch_executions(workspace_id);
CREATE INDEX idx_batch_executions_status ON public.batch_executions(status);
CREATE INDEX idx_batch_executions_created_at ON public.batch_executions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.batch_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view batch executions in their workspace"
  ON public.batch_executions FOR SELECT
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Users can insert batch executions in their workspace"
  ON public.batch_executions FOR INSERT
  WITH CHECK (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Users can update batch executions in their workspace"
  ON public.batch_executions FOR UPDATE
  USING (has_tenant_access(auth.uid(), workspace_id));

CREATE POLICY "Users can delete batch executions in their workspace"
  ON public.batch_executions FOR DELETE
  USING (has_tenant_access(auth.uid(), workspace_id));