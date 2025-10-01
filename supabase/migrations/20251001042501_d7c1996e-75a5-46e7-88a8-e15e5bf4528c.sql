-- Create storage bucket for tenant logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-logos',
  'tenant-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Create storage policies for tenant logos
CREATE POLICY "Tenant logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');

CREATE POLICY "Authenticated users can upload tenant logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update tenant logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tenant-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete tenant logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tenant-logos' 
  AND auth.role() = 'authenticated'
);