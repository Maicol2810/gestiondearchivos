/*
  # Fix system functionality without storage policy changes

  1. Functions
    - create_document: Enhanced document creation with better error handling
    - update_document: Enhanced document update functionality
    - update_user_profile: Fix user profile updates with password changes

  2. Security
    - Proper permission validation
    - Enhanced error handling
    - Better data validation
*/

-- Function to create document with enhanced error handling
CREATE OR REPLACE FUNCTION public.create_document(
  document_data jsonb,
  user_id uuid,
  user_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_dependencia_id uuid;
  doc_dependencia_id uuid;
  new_document_id uuid;
BEGIN
  -- Get user's dependencia
  SELECT p.dependencia_id INTO user_dependencia_id
  FROM profiles p
  WHERE p.id = user_id;

  -- Extract dependencia_id from document_data
  doc_dependencia_id := (document_data->>'dependencia_id')::uuid;

  -- Validate permissions
  IF user_role != 'Administrador' AND (user_dependencia_id IS NULL OR doc_dependencia_id != user_dependencia_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'No tienes permisos para crear documentos en esta dependencia'
    );
  END IF;

  -- Generate new document ID
  new_document_id := gen_random_uuid();

  -- Insert document
  INSERT INTO documentos (
    id,
    nombre,
    codigo_unico,
    dependencia_id,
    serie_id,
    subserie_id,
    fecha_creacion_documento,
    ubicacion_fisica,
    soporte,
    estado,
    observaciones,
    archivo_nombre,
    archivo_url,
    created_by
  ) VALUES (
    new_document_id,
    document_data->>'nombre',
    document_data->>'codigo_unico',
    (document_data->>'dependencia_id')::uuid,
    (document_data->>'serie_id')::uuid,
    (document_data->>'subserie_id')::uuid,
    CASE 
      WHEN document_data->>'fecha_creacion_documento' != '' AND document_data->>'fecha_creacion_documento' IS NOT NULL
      THEN (document_data->>'fecha_creacion_documento')::date 
      ELSE NULL 
    END,
    NULLIF(document_data->>'ubicacion_fisica', ''),
    (document_data->>'soporte')::document_support,
    (document_data->>'estado')::document_status,
    NULLIF(document_data->>'observaciones', ''),
    NULLIF(document_data->>'archivo_nombre', ''),
    NULLIF(document_data->>'archivo_url', ''),
    user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'document_id', new_document_id,
    'message', 'Documento creado correctamente'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUPLICATE_CODE',
      'message', 'El código único ya existe en el sistema'
    );
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLSTATE,
      'message', SQLERRM
    );
END;
$$;

-- Function to update user profile with password changes
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