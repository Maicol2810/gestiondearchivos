-- Actualizar políticas RLS para que los usuarios solo vean documentos de su dependencia

-- Eliminar la política actual de SELECT para documentos
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos" ON public.documentos;

-- Crear nueva política para que los usuarios solo vean documentos de su dependencia
CREATE POLICY "Usuarios pueden ver documentos de su dependencia" 
ON public.documentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Administradores pueden ver todos los documentos
    is_admin(auth.uid()) OR
    -- Usuarios pueden ver documentos de su dependencia
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.dependencia_id = documentos.dependencia_id
    )
  )
);

-- Actualizar política de INSERT para que usuarios solo puedan crear documentos de su dependencia
DROP POLICY IF EXISTS "Administradores y usuarios solicitantes pueden crear documentos" ON public.documentos;

CREATE POLICY "Usuarios pueden crear documentos de su dependencia" 
ON public.documentos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Administradores pueden crear documentos para cualquier dependencia
    is_admin(auth.uid()) OR
    -- Usuarios solo pueden crear documentos para su dependencia
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.dependencia_id = documentos.dependencia_id
    )
  )
);