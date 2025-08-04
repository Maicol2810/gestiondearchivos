-- Verificar y arreglar políticas RLS para profiles

-- Eliminar políticas problemáticas existentes
DROP POLICY IF EXISTS "Solo administradores pueden crear perfiles" ON profiles;
DROP POLICY IF EXISTS "Solo administradores pueden eliminar perfiles" ON profiles;
DROP POLICY IF EXISTS "Solo administradores pueden modificar perfiles" ON profiles;
DROP POLICY IF EXISTS "Los administradores pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON profiles;

-- Crear nuevas políticas más específicas
CREATE POLICY "Administradores pueden ver todos los perfiles" 
ON profiles 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Administradores pueden crear perfiles" 
ON profiles 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Administradores pueden actualizar cualquier perfil" 
ON profiles 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id AND NOT is_admin(auth.uid()));

CREATE POLICY "Administradores pueden eliminar perfiles" 
ON profiles 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Verificar que las políticas de documentos estén correctas para filtrar por dependencia
DROP POLICY IF EXISTS "Usuarios pueden ver documentos de su dependencia" ON documentos;
DROP POLICY IF EXISTS "Usuarios pueden crear documentos de su dependencia" ON documentos;

CREATE POLICY "Administradores pueden ver todos los documentos" 
ON documentos 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden ver documentos de su dependencia" 
ON documentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  NOT is_admin(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.dependencia_id = documentos.dependencia_id
  )
);

CREATE POLICY "Administradores pueden crear documentos para cualquier dependencia" 
ON documentos 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden crear documentos para su dependencia" 
ON documentos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  NOT is_admin(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.dependencia_id = documentos.dependencia_id
  )
);