-- Create tenant-backgrounds storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-backgrounds',
  'tenant-backgrounds',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);

-- RLS Policies for tenant-backgrounds bucket
CREATE POLICY "Authenticated users can upload background images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tenant-backgrounds');

CREATE POLICY "Background images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tenant-backgrounds');

CREATE POLICY "Users can update their tenant background images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-backgrounds');

CREATE POLICY "Users can delete their tenant background images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-backgrounds');
