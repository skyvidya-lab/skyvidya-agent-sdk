-- Criar tabelas de logs estruturados se não existirem
-- Validar se as tabelas já existem e ajustar conforme necessário

-- 1. Garantir que a tabela logs tenha a estrutura correta
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'logs') THEN
    CREATE TABLE public.logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
      agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
      conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
      user_id uuid,
      level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
      message text NOT NULL,
      context jsonb DEFAULT '{}'::jsonb
    );
    
    CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
    CREATE INDEX idx_logs_tenant_id ON logs(tenant_id);
    CREATE INDEX idx_logs_level ON logs(level);
  END IF;
END $$;

-- 2. Garantir que a tabela agent_calls tenha a estrutura correta
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_calls') THEN
    CREATE TABLE public.agent_calls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
      agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
      conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
      user_id uuid,
      status text NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
      response_time_ms integer,
      tokens_used integer,
      message_length integer NOT NULL,
      platform text NOT NULL,
      error_message text,
      error_code text,
      metadata jsonb DEFAULT '{}'::jsonb
    );
    
    CREATE INDEX idx_agent_calls_created_at ON agent_calls(created_at DESC);
    CREATE INDEX idx_agent_calls_tenant_id ON agent_calls(tenant_id);
    CREATE INDEX idx_agent_calls_agent_id ON agent_calls(agent_id);
    CREATE INDEX idx_agent_calls_status ON agent_calls(status);
  END IF;
END $$;

-- 3. Habilitar RLS nas tabelas
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_calls ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para logs
DROP POLICY IF EXISTS "Users access logs from their tenants" ON public.logs;
CREATE POLICY "Users access logs from their tenants"
ON public.logs FOR ALL
USING (has_tenant_access(auth.uid(), tenant_id));

-- 5. Criar políticas RLS para agent_calls  
DROP POLICY IF EXISTS "Users access agent_calls from their tenants" ON public.agent_calls;
CREATE POLICY "Users access agent_calls from their tenants"
ON public.agent_calls FOR ALL
USING (has_tenant_access(auth.uid(), tenant_id));