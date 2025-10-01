-- Criar tabela para métricas detalhadas de chamadas aos agentes
CREATE TABLE IF NOT EXISTS public.agent_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Request data
  message_length INTEGER NOT NULL,
  platform TEXT NOT NULL,
  
  -- Response data
  status TEXT NOT NULL, -- 'success', 'error', 'timeout'
  response_time_ms INTEGER,
  tokens_used INTEGER,
  error_message TEXT,
  error_code TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view agent calls in their tenants
CREATE POLICY "Users can view agent calls in their tenants"
ON public.agent_calls
FOR SELECT
TO authenticated
USING (has_tenant_access(auth.uid(), tenant_id));

-- Policy: System can insert agent calls
CREATE POLICY "System can insert agent calls"
ON public.agent_calls
FOR INSERT
TO authenticated
WITH CHECK (has_tenant_access(auth.uid(), tenant_id));

-- Create indexes for better performance
CREATE INDEX idx_agent_calls_tenant_id ON public.agent_calls(tenant_id);
CREATE INDEX idx_agent_calls_agent_id ON public.agent_calls(agent_id);
CREATE INDEX idx_agent_calls_created_at ON public.agent_calls(created_at DESC);
CREATE INDEX idx_agent_calls_status ON public.agent_calls(status);