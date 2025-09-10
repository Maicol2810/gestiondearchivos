/*
  # Fix Storage Policies for File Uploads

  1. Storage Policies
    - Create proper RLS policies for the documentos bucket
    - Allow authenticated users to upload files
    - Allow users to read files they have access to

  2. Security
    - Enable RLS on storage.objects
    - Add policies for INSERT, SELECT operations
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to documentos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from documentos bucket" ON storage.objects;

-- Create policy to allow authenticated users to upload files to documentos bucket
CREATE POLICY "Allow authenticated uploads to documentos bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentos');

-- Create policy to allow authenticated users to read files from documentos bucket
CREATE POLICY "Allow authenticated reads from documentos bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documentos');

-- Ensure the documentos bucket exists and is public for reads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documentos', 'documentos', true, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;