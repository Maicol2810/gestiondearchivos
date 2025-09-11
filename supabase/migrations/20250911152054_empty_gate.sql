@@ .. @@
 -- Create policy to allow authenticated users to read files from documentos bucket
-CREATE POLICY "Allow authenticated reads from documentos bucket"
+CREATE POLICY "Allow public reads from documentos bucket"
   ON storage.objects
   FOR SELECT
-  TO authenticated
-  USING (bucket_id = 'documentos');
+  TO public
+  USING (bucket_id = 'documentos');