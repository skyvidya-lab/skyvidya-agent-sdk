-- Criar tabela de domínios customizados para tenants
CREATE TABLE IF NOT EXISTS tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  domain text UNIQUE NOT NULL,
  is_primary boolean DEFAULT false,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verification_token text DEFAULT encode(gen_random_bytes(32), 'hex'),
  ssl_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- Tenant admins podem gerenciar seus domínios
CREATE POLICY "Tenant admins can manage their domains"
ON tenant_domains FOR ALL
USING (
  has_role(auth.uid(), tenant_id, 'tenant_admin') OR 
  has_role(auth.uid(), tenant_id, 'super_admin')
);

-- Público pode visualizar domínios verificados
CREATE POLICY "Public can view verified domains"
ON tenant_domains FOR SELECT
USING (verified = true);

-- Índices para performance
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX idx_tenant_domains_tenant_id ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_verified ON tenant_domains(verified) WHERE verified = true;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tenant_domains_updated_at
  BEFORE UPDATE ON tenant_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Garantir apenas um domínio primário por tenant
CREATE UNIQUE INDEX idx_tenant_primary_domain 
ON tenant_domains(tenant_id) 
WHERE is_primary = true;