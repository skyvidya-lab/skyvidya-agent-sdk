-- Adicionar campo auth_form_position em tenant_config
ALTER TABLE public.tenant_config 
ADD COLUMN auth_form_position TEXT DEFAULT 'center' 
CHECK (auth_form_position IN ('left', 'center', 'right'));

COMMENT ON COLUMN public.tenant_config.auth_form_position IS 'Posição do formulário de login: left (destaca direita), center (centralizado), right (destaca esquerda)';