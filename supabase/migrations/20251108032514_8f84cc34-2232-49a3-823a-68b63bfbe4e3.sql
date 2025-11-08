-- Adicionar campos de compatibilidade para acesso direto no tenant_config
ALTER TABLE tenant_config 
  ADD COLUMN IF NOT EXISTS primary_color TEXT,
  ADD COLUMN IF NOT EXISTS secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN tenant_config.primary_color IS 'Cor primária baseada no tema padrão - copiada do tema ativo';
COMMENT ON COLUMN tenant_config.secondary_color IS 'Cor secundária baseada no tema padrão - copiada do tema ativo';
COMMENT ON COLUMN tenant_config.accent_color IS 'Cor de destaque baseada no tema padrão - copiada do tema ativo';
COMMENT ON COLUMN tenant_config.logo_url IS 'URL do logo copiada da tabela tenants para facilitar acesso';