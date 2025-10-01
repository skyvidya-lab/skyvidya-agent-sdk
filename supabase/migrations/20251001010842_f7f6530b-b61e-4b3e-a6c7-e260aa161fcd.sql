-- Add external API integration fields to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
ADD COLUMN IF NOT EXISTS api_key_reference TEXT,
ADD COLUMN IF NOT EXISTS connection_config JSONB DEFAULT '{}'::jsonb;

-- Add comments to clarify field usage
COMMENT ON COLUMN public.agents.api_endpoint IS 'Base URL for external agent API (required for external platforms)';
COMMENT ON COLUMN public.agents.api_key_reference IS 'Reference to secret stored in Lovable Cloud (e.g., DIFY_API_KEY_TENANT_X)';
COMMENT ON COLUMN public.agents.connection_config IS 'Platform-specific connection settings (headers, auth type, etc)';
COMMENT ON COLUMN public.agents.model_name IS 'Model used (required for native agents, optional metadata for external)';
COMMENT ON COLUMN public.agents.temperature IS 'Temperature setting (required for native agents, optional metadata for external)';
COMMENT ON COLUMN public.agents.max_tokens IS 'Max tokens (required for native agents, optional metadata for external)';
COMMENT ON COLUMN public.agents.system_prompt IS 'System prompt (required for native agents, optional metadata for external)';