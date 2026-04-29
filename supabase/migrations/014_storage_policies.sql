-- Create the ember storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('ember', 'ember', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload (INSERT) to the ember bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to ember"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ember');

-- Allow authenticated users to update (upsert) their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can update ember objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ember');

-- Allow authenticated users to delete their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can delete ember objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ember');

-- Allow public (anyone) to read/download from the ember bucket
CREATE POLICY IF NOT EXISTS "Public can read ember objects"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ember');
