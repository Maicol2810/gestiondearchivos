/*
  # Actualización de roles de usuario y permisos por dependencia

  1. Cambios en roles
    - Actualizar rol "Usuario_solicitante" a "Usuario"
    - Mantener solo "Administrador" y "Usuario"
    - Actualizar enum y registros existentes

  2. Seguridad por dependencia
    - Actualizar políticas RLS para control por dependencia
    - Los usuarios solo ven documentos de su dependencia
    - Los administradores ven todo

  3. Permisos de documentos
    - Permitir cualquier estado y soporte
    - Mejorar control de acceso por dependencia
*/

-- Actualizar el enum de roles de usuario
ALTER TYPE public.user_role RENAME TO user_role_old;
CREATE TYPE public.user_role AS ENUM ('Administrador', 'Usuario');

-- Actualizar la columna rol en la tabla profiles
ALTER TABLE public.profiles ALTER COLUMN rol TYPE user_role USING 
  CASE 
    WHEN rol::text = 'Usuario_solicitante' THEN 'Usuario'::user_role
    WHEN rol::text = 'Consultor' THEN 'Usuario'::user_role
    ELSE rol::text::user_role
  END;

-- Eliminar el enum antiguo
DROP TYPE user_role_old;

-- Actualizar función get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
    SELECT rol FROM public.profiles WHERE id = user_id;
$$;

-- Función para obtener la dependencia del usuario
CREATE OR REPLACE FUNCTION public.get_user_dependencia(user_id UUID)
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
    SELECT dependencia_id FROM public.profiles WHERE id = user_id;
$$;

-- Actualizar políticas RLS para documentos con control por dependencia
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos" ON public.documentos;
DROP POLICY IF EXISTS "Administradores y usuarios solicitantes pueden crear documentos" ON public.documentos;
DROP POLICY IF EXISTS "Solo administradores pueden modificar documentos" ON public.documentos;
DROP POLICY IF EXISTS "Solo administradores pueden eliminar documentos" ON public.documentos;

-- Nuevas políticas para documentos
CREATE POLICY "Administradores pueden ver todos los documentos" 
ON public.documentos 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden ver documentos de su dependencia" 
ON public.documentos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  NOT public.is_admin(auth.uid()) AND 
  dependencia_id = public.get_user_dependencia(auth.uid())
);

CREATE POLICY "Administradores pueden crear cualquier documento" 
ON public.documentos 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden crear documentos de su dependencia" 
ON public.documentos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  NOT public.is_admin(auth.uid()) AND 
  dependencia_id = public.get_user_dependencia(auth.uid()) AND
  created_by = auth.uid()
);

CREATE POLICY "Administradores pueden modificar cualquier documento" 
ON public.documentos 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden modificar documentos de su dependencia" 
ON public.documentos 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  NOT public.is_admin(auth.uid()) AND 
  dependencia_id = public.get_user_dependencia(auth.uid()) AND
  created_by = auth.uid()
);

CREATE POLICY "Solo administradores pueden eliminar documentos" 
ON public.documentos 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Actualizar políticas para préstamos
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios préstamos" ON public.prestamos;
DROP POLICY IF EXISTS "Los usuarios pueden crear préstamos" ON public.prestamos;

CREATE POLICY "Administradores pueden ver todos los préstamos" 
ON public.prestamos 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuarios pueden ver préstamos de documentos de su dependencia" 
ON public.prestamos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  (
    auth.uid() = usuario_solicitante_id OR
    EXISTS (
      SELECT 1 FROM public.documentos d 
      WHERE d.id = documento_id 
      AND d.dependencia_id = public.get_user_dependencia(auth.uid())
    )
  )
);

CREATE POLICY "Usuarios pueden crear préstamos de documentos de su dependencia" 
ON public.prestamos 
FOR INSERT 
WITH CHECK (
  auth.uid() = usuario_solicitante_id AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.documentos d 
    WHERE d.id = documento_id 
    AND (
      public.is_admin(auth.uid()) OR 
      d.dependencia_id = public.get_user_dependencia(auth.uid())
    )
  )
);

-- Actualizar trigger para crear perfil con rol Usuario por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nombre_completo, rol)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
        'Usuario'
    );
    RETURN NEW;
END;
$$;

-- Función para promover usuario a administrador (solo para uso administrativo)
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles 
    SET rol = 'Administrador'
    WHERE email = user_email;
END;
$$;

-- Función para crear el primer administrador si no existe ninguno
CREATE OR REPLACE FUNCTION public.create_first_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Si no hay administradores, promover al primer usuario
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE rol = 'Administrador') THEN
        UPDATE public.profiles 
        SET rol = 'Administrador'
        WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
    END IF;
END;
$$;