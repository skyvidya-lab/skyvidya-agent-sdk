-- Criar tabela tenant_config para branding
CREATE TABLE tenant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Branding visual
  logo_url text,
  primary_color text DEFAULT '#000000',
  secondary_color text DEFAULT '#666666',
  accent_color text DEFAULT '#0066CC',
  font_family text DEFAULT 'Inter',
  background_image_url text,
  
  -- Textos customizados
  hero_title text DEFAULT 'Como posso ajudar você hoje?',
  hero_subtitle text DEFAULT 'Faça perguntas sobre nossos serviços',
  chat_placeholder text DEFAULT 'Digite sua mensagem...',
  welcome_message jsonb DEFAULT '{"title": "Bem-vindo", "subtitle": "Estamos aqui para ajudar"}',
  
  -- Features habilitadas
  enable_google_auth boolean DEFAULT true,
  enable_guest_access boolean DEFAULT false,
  enable_file_upload boolean DEFAULT false,
  enable_conversation_export boolean DEFAULT true,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem visualizar config dos seus tenants
CREATE POLICY "Users can view config of their tenants"
  ON tenant_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.tenant_id = tenant_config.tenant_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- Policy: Admins podem gerenciar config
CREATE POLICY "Tenant admins can update their config"
  ON tenant_config FOR ALL
  USING (
    has_role(auth.uid(), tenant_id, 'tenant_admin'::app_role) OR
    has_role(auth.uid(), tenant_id, 'super_admin'::app_role)
  );

-- Trigger para updated_at
CREATE TRIGGER update_tenant_config_updated_at
  BEFORE UPDATE ON tenant_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir tenant de exemplo para testes
INSERT INTO tenants (id, name, slug, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Plano Diretor Porto Alegre',
  'plano-diretor',
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir configuração visual de exemplo
INSERT INTO tenant_config (
  tenant_id,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  hero_title,
  hero_subtitle,
  chat_placeholder,
  background_image_url
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200',
  '#0066CC',
  '#003366',
  '#FF6B35',
  'Plano Diretor de Porto Alegre',
  'Tire suas dúvidas sobre o desenvolvimento urbano da cidade',
  'Pergunte sobre zoneamento, ocupação do solo...',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920'
) ON CONFLICT (tenant_id) DO NOTHING;