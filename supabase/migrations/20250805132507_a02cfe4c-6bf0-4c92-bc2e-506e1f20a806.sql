-- Verificar y corregir problemas con la creación de usuarios

-- Asegurar que la extensión pgcrypto esté disponible
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verificar si ya existe un administrador
DO $$
DECLARE
    admin_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Contar administradores existentes
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles
    WHERE rol = 'Administrador';
    
    -- Si no hay administradores, promover al primer usuario o crear uno
    IF admin_count = 0 THEN
        -- Intentar promover usuario específico
        UPDATE public.profiles 
        SET rol = 'Administrador'
        WHERE email = 'torresmaicol52@gmail.com';
        
        -- Si no se encontró ese usuario, promover al primer usuario registrado
        IF NOT FOUND THEN
            SELECT id INTO first_user_id 
            FROM public.profiles 
            ORDER BY created_at 
            LIMIT 1;
            
            IF first_user_id IS NOT NULL THEN
                UPDATE public.profiles 
                SET rol = 'Administrador'
                WHERE id = first_user_id;
            END IF;
        END IF;
    END IF;
END $$;

-- Simplificar la función de creación de usuarios y mejorar el manejo de errores
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
  
  -- Insertar en la tabla profiles
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
      'error', SQLSTATE,
      'message', SQLERRM
    );
END;
$$;