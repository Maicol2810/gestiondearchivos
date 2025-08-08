-- Arreglar la función authenticate_user para usar el esquema completo de pgcrypto
CREATE OR REPLACE FUNCTION public.authenticate_user(user_email text, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  user_record record;
  is_password_valid boolean;
BEGIN
  -- Buscar el usuario por email
  SELECT id, email, nombre_completo, rol, password_hash, activo 
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
  
  -- Verificar la contraseña usando la extensión pgcrypto con schema completo
  SELECT (user_record.password_hash = extensions.crypt(user_password, user_record.password_hash)) INTO is_password_valid;
  
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
      'rol', user_record.rol
    ),
    'message', 'Autenticación exitosa'
  );
END;
$function$;