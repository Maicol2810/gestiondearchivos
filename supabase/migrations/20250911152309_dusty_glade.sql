/*
  # Fix Storage Policies for Document Uploads

  1. Storage Policies
    - Drop existing problematic policies
    - Create new policies that allow public access for reads
    - Allow authenticated users to upload files

  2. Security
    - Public read access for documentos bucket
    - Authenticated upload access
    - Proper bucket configuration
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated reads from documentos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from documentos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to documentos bucket" ON storage.objects;

-- Create policy to allow public reads from documentos bucket (since it's a public bucket)
CREATE POLICY "Allow public reads from documentos bucket"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'documentos');

-- Create policy to allow authenticated users to upload files to documentos bucket
CREATE POLICY "Allow authenticated uploads to documentos bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentos');

-- Ensure the documentos bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documentos', 'documentos', true, 52428800, ARRAY[
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/bmp', 
  'image/tiff'
])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;