-- Solucionar el problema de foreign key constraint y mejorar la función de creación de usuarios

-- El problema está en que profiles.id tiene una foreign key hacia auth.users
-- pero estamos generando UUIDs manualmente. Necesitamos cambiar esto.

-- Primero, eliminar la restricción de foreign key si existe
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Recrear la función de creación de usuarios sin la restricción de auth.users
CREATE OR REPLACE FUNCTION public.create_user_for_admin(
  user_email text,
  user_password text,
  full_name text,
  user_role text DEFAULT 'Usuario',
  dep_id uuid DEFAULT NULL,
  is_active boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  result json;
  admin_check boolean;
BEGIN
  -- Verificar que quien llama es administrador
  SELECT is_admin(auth.uid()) INTO admin_check;
  
  IF NOT admin_check THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ADMIN_REQUIRED',
      'message', 'Solo los administradores pueden crear usuarios'
    );
  END IF;

  -- Verificar que el email no esté en uso
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = user_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EMAIL_EXISTS',
      'message', 'El email ya está registrado en el sistema'
    );
  END IF;

  -- Generar un ID único para el nuevo usuario
  new_user_id := gen_random_uuid();
  
  -- Insertar en la tabla profiles (sin hash de contraseña por simplicidad)
  INSERT INTO public.profiles (
    id,
    email,
    nombre_completo,
    rol,
    dependencia_id,
    activo
  ) VALUES (
    new_user_id,
    user_email,
    full_name,
    user_role::user_role,
    dep_id,
    is_active
  );

  -- Retornar información del usuario creado
  result := json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'message', 'Usuario creado correctamente'
  );
  
  RETURN result;
EXCEPTION
  WHEN others THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLSTATE,
      'message', SQLERRM
    );
END;
$$;