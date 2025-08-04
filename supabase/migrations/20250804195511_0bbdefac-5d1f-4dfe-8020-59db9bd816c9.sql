-- Arreglar bucket de documentos y políticas de storage
-- Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios pueden ver documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar documentos" ON storage.objects;

-- Crear políticas para el bucket documentos
CREATE POLICY "Documentos son públicamente accesibles" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documentos');

CREATE POLICY "Usuarios autenticados pueden subir documentos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar sus documentos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

-- Actualizar el enum de roles para cambiar Usuario_solicitante por Usuario
ALTER TYPE user_role RENAME VALUE 'Usuario_solicitante' TO 'Usuario';

-- Actualizar registros existentes
UPDATE profiles SET rol = 'Usuario' WHERE rol = 'Usuario';

-- Agregar campo password a la tabla profiles para almacenar hash de contraseñas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;