-- Create the ember storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('ember', 'ember', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for the ember bucket
DROP POLICY IF EXISTS "Authenticated users can upload to ember" ON storage.objects;
CREATE POLICY "Authenticated users can upload to ember"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ember');

DROP POLICY IF EXISTS "Authenticated users can update ember objects" ON storage.objects;
CREATE POLICY "Authenticated users can update ember objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ember');

DROP POLICY IF EXISTS "Authenticated users can delete ember objects" ON storage.objects;
CREATE POLICY "Authenticated users can delete ember objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ember');

DROP POLICY IF EXISTS "Public can read ember objects" ON storage.objects;
CREATE POLICY "Public can read ember objects"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ember');
