/*
  # Corrección completa del sistema de roles y funcionalidades

  1. Corrección de roles de usuario
    - Eliminar valor por defecto problemático
    - Actualizar registros existentes correctamente
    - Crear enum limpio con solo Administrador y Usuario

  2. Funciones de gestión de usuarios
    - Función para crear usuarios desde el sistema
    - Generación de contraseñas seguras
    - Validación de permisos

  3. Políticas de seguridad por dependencia
    - Control estricto por dependencia para usuarios
    - Acceso completo para administradores

  4. Tablas de configuración
    - Gestión de dependencias
    - Series y subseries documentales
*/

-- Primero, eliminar el valor por defecto de la columna rol
ALTER TABLE public.profiles ALTER COLUMN rol DROP DEFAULT;

-- Actualizar todos los registros existentes
UPDATE public.profiles 
SET rol = 'Usuario'::user_role 
WHERE rol = 'Usuario_solicitante'::user_role;

UPDATE public.profiles 
SET rol = 'Usuario'::user_role 
WHERE rol = 'Consultor'::user_role;

-- Recrear el enum con solo los valores necesarios
ALTER TYPE public.user_role RENAME TO user_role_old;
CREATE TYPE public.user_role AS ENUM ('Administrador', 'Usuario');

-- Actualizar la columna con el nuevo tipo
ALTER TABLE public.profiles 
ALTER COLUMN rol TYPE user_role USING 
  CASE 
    WHEN rol::text = 'Usuario_solicitante' THEN 'Usuario'::user_role
    WHEN rol::text = 'Consultor' THEN 'Usuario'::user_role
    ELSE rol::text::user_role
  END;

-- Establecer nuevo valor por defecto
ALTER TABLE public.profiles ALTER COLUMN rol SET DEFAULT 'Usuario'::user_role;

-- Eliminar el enum antiguo
DROP TYPE user_role_old;

-- Función para generar contraseña segura
CREATE OR REPLACE FUNCTION public.generate_secure_password()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..12 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- Función para crear usuario desde el sistema (solo administradores)
CREATE OR REPLACE FUNCTION public.create_system_user(
    user_email TEXT,
    user_name TEXT,
    user_role user_role,
    user_dependencia_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_password TEXT;
    result JSON;
BEGIN
    -- Verificar que quien llama es administrador
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Solo los administradores pueden crear usuarios';
    END IF;

    -- Generar contraseña segura
    new_password := public.generate_secure_password();

    -- El usuario se creará a través de la función de Supabase Auth
    -- Por ahora retornamos la información para que el frontend maneje la creación
    result := json_build_object(
        'email', user_email,
        'name', user_name,
        'role', user_role,
        'dependencia_id', user_dependencia_id,
        'password', new_password
    );

    RETURN result;
END;
$$;

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

-- Actualizar políticas RLS para documentos con control estricto por dependencia
DROP POLICY IF EXISTS "Administradores pueden ver todos los documentos" ON public.documentos;
DROP POLICY IF EXISTS "Usuarios pueden ver documentos de su dependencia" ON public.documentos;
DROP POLICY IF EXISTS "Administradores pueden crear cualquier documento" ON public.documentos;
DROP POLICY IF EXISTS "Usuarios pueden crear documentos de su dependencia" ON public.documentos;
DROP POLICY IF EXISTS "Administradores pueden modificar cualquier documento" ON public.documentos;
DROP POLICY IF EXISTS "Usuarios pueden modificar documentos de su dependencia" ON public.documentos;
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

CREATE POLICY "Usuarios pueden modificar documentos que crearon en su dependencia" 
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

-- Actualizar políticas para storage de documentos
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos" ON storage.objects;
DROP POLICY IF EXISTS "Administradores y usuarios solicitantes pueden subir documentos" ON storage.objects;
DROP POLICY IF EXISTS "Solo administradores pueden eliminar documentos" ON storage.objects;

CREATE POLICY "Usuarios autenticados pueden ver documentos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden subir documentos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Solo administradores pueden eliminar archivos de documentos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documentos' AND public.is_admin(auth.uid()));

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
        'Usuario'::user_role
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
    SET rol = 'Administrador'::user_role
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
        SET rol = 'Administrador'::user_role
        WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
    END IF;
END;
$$;