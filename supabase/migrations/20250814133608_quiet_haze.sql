/*
  # Remove unnecessary fields and fix document access restrictions

  1. Database Changes
    - Remove tipo_documental and palabras_clave columns from documentos table
    - Update RLS policies to properly restrict access by dependencia

  2. Security Updates
    - Ensure users only see documents from their dependencia
    - Administrators can see all documents
    - Proper filtering by dependencia_id
*/

-- Remove unnecessary columns from documentos table
ALTER TABLE public.documentos DROP COLUMN IF EXISTS tipo_documental;
ALTER TABLE public.documentos DROP COLUMN IF EXISTS palabras_clave;

-- Drop existing policies for documentos to recreate them properly
DROP POLICY IF EXISTS "Administradores pueden ver todos los documentos" ON public.documentos;
DROP POLICY IF EXISTS "Usuarios pueden ver documentos de su dependencia" ON public.documentos;
DROP POLICY IF EXISTS "Administradores pueden crear cualquier documento" ON public.documentos;
DROP POLICY IF EXISTS "Usuarios pueden crear documentos de su dependencia" ON public.documentos;
DROP POLICY IF EXISTS "Administradores pueden modificar cualquier documento" ON public.documentos;
DROP POLICY IF EXISTS "Usuarios pueden modificar documentos que crearon en su dependencia" ON public.documentos;
DROP POLICY IF EXISTS "Solo administradores pueden eliminar documentos" ON public.documentos;

-- Create new, more restrictive policies for documentos
CREATE POLICY "Administradores pueden ver todos los documentos" 
ON public.documentos 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden ver solo documentos de su dependencia" 
ON public.documentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  NOT public.is_admin(auth.uid()) AND
  dependencia_id IN (
    SELECT dependencia_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND dependencia_id IS NOT NULL
  )
);

CREATE POLICY "Administradores pueden crear documentos para cualquier dependencia" 
ON public.documentos 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden crear documentos solo para su dependencia" 
ON public.documentos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  NOT public.is_admin(auth.uid()) AND
  created_by = auth.uid() AND
  dependencia_id IN (
    SELECT dependencia_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND dependencia_id IS NOT NULL
  )
);

CREATE POLICY "Administradores pueden modificar cualquier documento" 
ON public.documentos 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden modificar solo documentos que crearon en su dependencia" 
ON public.documentos 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  NOT public.is_admin(auth.uid()) AND
  created_by = auth.uid() AND
  dependencia_id IN (
    SELECT dependencia_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND dependencia_id IS NOT NULL
  )
);

CREATE POLICY "Solo administradores pueden eliminar documentos" 
ON public.documentos 
FOR DELETE 
USING (public.is_admin(auth.uid()));