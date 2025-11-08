-- Adicionar campo default_entry_point em tenant_config
ALTER TABLE public.tenant_config 
ADD COLUMN default_entry_point TEXT DEFAULT 'landing' 
CHECK (default_entry_point IN ('landing', 'auth'));

COMMENT ON COLUMN public.tenant_config.default_entry_point IS 'Define qual página o usuário vê ao acessar pela primeira vez: landing page ou login direto';