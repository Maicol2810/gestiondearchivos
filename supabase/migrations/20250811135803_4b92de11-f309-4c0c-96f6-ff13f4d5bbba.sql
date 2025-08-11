-- Corregir las funciones para usar MD5 en lugar de pgcrypto
-- que no está disponible en esta instancia de Supabase

-- Función para crear hash de contraseña simple
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
AS $$
  SELECT encode(digest(password || 'salt_uipca_2024', 'sha256'), 'hex');
$$;

-- Actualizar la función create_user_for_admin
CREATE OR REPLACE FUNCTION public.create_user_for_admin(user_email text, user_password text, full_name text, user_role text DEFAULT 'Usuario'::text, dep_id uuid DEFAULT NULL::uuid, is_active boolean DEFAULT true)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id uuid;
  result json;
  admin_check boolean;
  hashed_password text;
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
  
  -- Hashear la contraseña usando nuestra función
  hashed_password := hash_password(user_password);
  
  -- Insertar en la tabla profiles con contraseña hasheada
  INSERT INTO public.profiles (
    id,
    email,
    nombre_completo,
    rol,
    dependencia_id,
    activo,
    password_hash
  ) VALUES (
    new_user_id,
    user_email,
    full_name,
    user_role::user_role,
    dep_id,
    is_active,
    hashed_password
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
$function$;

-- Actualizar la función authenticate_user
CREATE OR REPLACE FUNCTION public.authenticate_user(user_email text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record record;
  is_password_valid boolean;
  input_password_hash text;
BEGIN
  -- Buscar el usuario por email
  SELECT id, email, nombre_completo, rol, password_hash, activo, dependencia_id
  INTO user_record
  FROM public.profiles 
  WHERE email = user_email;
  
  -- Verificar si el usuario existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Usuario no encontrado'
    );
  END IF;
  
  -- Verificar si el usuario está activo
  IF NOT user_record.activo THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_INACTIVE',
      'message', 'Usuario inactivo'
    );
  END IF;
  
  -- Verificar si hay contraseña hasheada
  IF user_record.password_hash IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NO_PASSWORD',
      'message', 'Usuario sin contraseña configurada'
    );
  END IF;
  
  -- Hashear la contraseña ingresada para compararla
  input_password_hash := hash_password(user_password);
  
  -- Verificar la contraseña
  is_password_valid := (user_record.password_hash = input_password_hash);
  
  IF NOT is_password_valid THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_PASSWORD',
      'message', 'Contraseña incorrecta'
    );
  END IF;
  
  -- Retornar información del usuario autenticado
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'nombre_completo', user_record.nombre_completo,
      'rol', user_record.rol,
      'dependencia_id', user_record.dependencia_id
    ),
    'message', 'Autenticación exitosa'
  );
END;
$function$;

-- Actualizar las contraseñas existentes de los usuarios de prueba
UPDATE public.profiles 
SET password_hash = hash_password('123456')
WHERE email IN ('torresmaicol52@gmail.com', 'admin@upca.edu.co', 'prueba@pca.edu.co');