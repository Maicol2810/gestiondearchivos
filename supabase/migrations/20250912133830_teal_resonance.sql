@@ .. @@
 -- Create policy to allow authenticated users to upload files to documentos bucket
 CREATE POLICY "Allow authenticated uploads to documentos bucket"
   ON storage.objects
   FOR INSERT
-  TO authenticated
-  WITH CHECK (bucket_id = 'documentos');
+  WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);