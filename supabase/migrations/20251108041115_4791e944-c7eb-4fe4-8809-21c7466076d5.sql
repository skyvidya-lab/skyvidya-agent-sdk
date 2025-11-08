-- Adicionar campo hero_image_url para ilustração hero customizada
ALTER TABLE tenant_config 
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

COMMENT ON COLUMN tenant_config.hero_image_url IS 'URL da imagem/ilustração hero para a página inicial do chat (separada do logo)';