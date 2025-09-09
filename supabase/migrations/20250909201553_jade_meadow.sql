/*
  # Fix user profile update function

  1. Function
    - update_user_profile: Update user profile with optional password change
    - Proper error handling and validation

  2. Security
    - Only administrators can update user profiles
    - Validates permissions before making changes
    - Handles password hashing when needed
*/

-- Function to update user profile with optional password change
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_id uuid,
  user_data jsonb,
  requesting_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_role user_role;
  hashed_password text;
BEGIN
  -- Get requesting user's role
  SELECT p.rol INTO requesting_user_role
  FROM profiles p
  WHERE p.id = requesting_user_id;

  -- Only admins can update user profiles
  IF requesting_user_role != 'Administrador' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'Solo los administradores pueden actualizar perfiles de usuario'
    );
  END IF;

  -- Check if password needs to be updated
  IF user_data ? 'password' THEN
    hashed_password := hash_password(user_data->>'password');
    
    -- Update with password
    UPDATE profiles SET
      nombre_completo = user_data->>'nombre_completo',
      rol = (user_data->>'rol')::user_role,
      dependencia_id = CASE 
        WHEN user_data->>'dependencia_id' = '' THEN NULL
        ELSE (user_data->>'dependencia_id')::uuid
      END,
      activo = (user_data->>'activo')::boolean,
      password_hash = hashed_password,
      updated_at = now()
    WHERE id = user_id;
  ELSE
    -- Update without password
    UPDATE profiles SET
      nombre_completo = user_data->>'nombre_completo',
      rol = (user_data->>'rol')::user_role,
      dependencia_id = CASE 
        WHEN user_data->>'dependencia_id' = '' THEN NULL
        ELSE (user_data->>'dependencia_id')::uuid
      END,
      activo = (user_data->>'activo')::boolean,
      updated_at = now()
    WHERE id = user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Perfil actualizado correctamente'
  );

EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLSTATE,
      'message', SQLERRM
    );
END;
$$;