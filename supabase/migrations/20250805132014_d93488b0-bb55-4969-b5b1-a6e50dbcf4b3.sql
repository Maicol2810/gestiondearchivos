-- Crear una función que permita a los administradores crear usuarios
-- Esta función utilizará el role service_role internamente
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
AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Verificar que quien llama es administrador
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Solo los administradores pueden crear usuarios';
  END IF;

  -- Generar un ID único para el nuevo usuario
  new_user_id := gen_random_uuid();
  
  -- Insertar directamente en la tabla profiles
  -- El trigger handle_new_user se encargará de sincronizar
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
    crypt(user_password, gen_salt('bf'))
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
      'error', SQLERRM,
      'message', 'Error al crear el usuario'
    );
END;
$$;