-- Criar bucket tenant-logos se não existir (idempotente)
DO $$ 
BEGIN
  -- Verifica se o bucket já existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'tenant-logos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('tenant-logos', 'tenant-logos', true);
  END IF;
END $$;

-- Dropar policies antigas se existirem e recriar
DROP POLICY IF EXISTS "Logos são publicamente acessíveis" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar logos" ON storage.objects;

-- RLS Policy: Leitura pública de logos
CREATE POLICY "Logos são publicamente acessíveis"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tenant-logos');

-- RLS Policy: Upload apenas para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-logos' 
  AND auth.uid() IS NOT NULL
);

-- RLS Policy: Usuários autenticados podem atualizar logos
CREATE POLICY "Usuários autenticados podem atualizar logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'tenant-logos' 
  AND auth.uid() IS NOT NULL
);

-- RLS Policy: Usuários autenticados podem deletar logos
CREATE POLICY "Usuários autenticados podem deletar logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'tenant-logos' 
  AND auth.uid() IS NOT NULL
);