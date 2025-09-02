/*
  # Fix document creation and data access for custom authentication

  1. Updated Functions
    - create_document: Allow proper document creation with role-based permissions
    - update_document: Allow document updates with proper validation
    - get_user_documents: Ensure all documents are properly loaded

  2. Security
    - Administrators can create documents for any dependencia
    - Users can create documents only for their assigned dependencia
    - Proper visibility based on user role and dependencia
*/

-- Function to create document with proper permissions
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
  result jsonb;
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

-- Function to update document with proper permissions
CREATE OR REPLACE FUNCTION public.update_document(
  document_id uuid,
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
  doc_created_by uuid;
BEGIN
  -- Get user's dependencia
  SELECT p.dependencia_id INTO user_dependencia_id
  FROM profiles p
  WHERE p.id = user_id;

  -- Get document info
  SELECT d.dependencia_id, d.created_by INTO doc_dependencia_id, doc_created_by
  FROM documentos d
  WHERE d.id = document_id;

  -- Check if document exists
  IF doc_dependencia_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DOCUMENT_NOT_FOUND',
      'message', 'Documento no encontrado'
    );
  END IF;

  -- Validate permissions
  IF user_role != 'Administrador' AND (
    user_dependencia_id IS NULL OR 
    doc_dependencia_id != user_dependencia_id OR
    doc_created_by != user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PERMISSION_DENIED',
      'message', 'No tienes permisos para modificar este documento'
    );
  END IF;

  -- Update document
  UPDATE documentos SET
    nombre = document_data->>'nombre',
    codigo_unico = document_data->>'codigo_unico',
    dependencia_id = (document_data->>'dependencia_id')::uuid,
    serie_id = (document_data->>'serie_id')::uuid,
    subserie_id = (document_data->>'subserie_id')::uuid,
    fecha_creacion_documento = CASE 
      WHEN document_data->>'fecha_creacion_documento' != '' AND document_data->>'fecha_creacion_documento' IS NOT NULL
      THEN (document_data->>'fecha_creacion_documento')::date 
      ELSE NULL 
    END,
    ubicacion_fisica = NULLIF(document_data->>'ubicacion_fisica', ''),
    soporte = (document_data->>'soporte')::document_support,
    estado = (document_data->>'estado')::document_status,
    observaciones = NULLIF(document_data->>'observaciones', ''),
    archivo_nombre = COALESCE(NULLIF(document_data->>'archivo_nombre', ''), archivo_nombre),
    archivo_url = COALESCE(NULLIF(document_data->>'archivo_url', ''), archivo_url),
    updated_at = now()
  WHERE id = document_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Documento actualizado correctamente'
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

-- Function to get user documents with proper filtering
CREATE OR REPLACE FUNCTION public.get_user_documents(user_id uuid, user_role text)
RETURNS TABLE (
  id uuid,
  codigo_unico text,
  nombre text,
  serie_id uuid,
  subserie_id uuid,
  dependencia_id uuid,
  fecha_ingreso date,
  soporte document_support,
  ubicacion_fisica text,
  estado document_status,
  observaciones text,
  archivo_url text,
  archivo_nombre text,
  fecha_creacion_documento date,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  dependencias jsonb,
  series_documentales jsonb,
  subseries_documentales jsonb,
  created_by_profile jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_dependencia_id uuid;
BEGIN
  -- Get user's dependencia
  SELECT p.dependencia_id INTO user_dependencia_id
  FROM profiles p
  WHERE p.id = user_id;

  -- Return documents based on role
  IF user_role = 'Administrador' THEN
    -- Admin can see all documents
    RETURN QUERY
    SELECT 
      d.id,
      d.codigo_unico,
      d.nombre,
      d.serie_id,
      d.subserie_id,
      d.dependencia_id,
      d.fecha_ingreso,
      d.soporte,
      d.ubicacion_fisica,
      d.estado,
      d.observaciones,
      d.archivo_url,
      d.archivo_nombre,
      d.fecha_creacion_documento,
      d.created_by,
      d.created_at,
      d.updated_at,
      jsonb_build_object('nombre', dep.nombre) as dependencias,
      jsonb_build_object('nombre', ser.nombre) as series_documentales,
      jsonb_build_object('nombre', sub.nombre) as subseries_documentales,
      jsonb_build_object('nombre_completo', prof.nombre_completo) as created_by_profile
    FROM documentos d
    LEFT JOIN dependencias dep ON d.dependencia_id = dep.id
    LEFT JOIN series_documentales ser ON d.serie_id = ser.id
    LEFT JOIN subseries_documentales sub ON d.subserie_id = sub.id
    LEFT JOIN profiles prof ON d.created_by = prof.id
    ORDER BY d.created_at DESC;
  ELSE
    -- Regular users can only see documents from their dependencia
    RETURN QUERY
    SELECT 
      d.id,
      d.codigo_unico,
      d.nombre,
      d.serie_id,
      d.subserie_id,
      d.dependencia_id,
      d.fecha_ingreso,
      d.soporte,
      d.ubicacion_fisica,
      d.estado,
      d.observaciones,
      d.archivo_url,
      d.archivo_nombre,
      d.fecha_creacion_documento,
      d.created_by,
      d.created_at,
      d.updated_at,
      jsonb_build_object('nombre', dep.nombre) as dependencias,
      jsonb_build_object('nombre', ser.nombre) as series_documentales,
      jsonb_build_object('nombre', sub.nombre) as subseries_documentales,
      jsonb_build_object('nombre_completo', prof.nombre_completo) as created_by_profile
    FROM documentos d
    LEFT JOIN dependencias dep ON d.dependencia_id = dep.id
    LEFT JOIN series_documentales ser ON d.serie_id = ser.id
    LEFT JOIN subseries_documentales sub ON d.subserie_id = sub.id
    LEFT JOIN profiles prof ON d.created_by = prof.id
    WHERE d.dependencia_id = user_dependencia_id
    ORDER BY d.created_at DESC;
  END IF;
END;
$$;

-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users(requesting_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  nombre_completo text,
  rol user_role,
  dependencia_id uuid,
  activo boolean,
  created_at timestamptz,
  updated_at timestamptz,
  dependencias jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_role user_role;
BEGIN
  -- Get requesting user's role
  SELECT p.rol INTO requesting_user_role
  FROM profiles p
  WHERE p.id = requesting_user_id;

  -- Only admins can see all users
  IF requesting_user_role = 'Administrador' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.nombre_completo,
      p.rol,
      p.dependencia_id,
      p.activo,
      p.created_at,
      p.updated_at,
      jsonb_build_object('nombre', d.nombre) as dependencias
    FROM profiles p
    LEFT JOIN dependencias d ON p.dependencia_id = d.id
    ORDER BY p.created_at DESC;
  ELSE
    -- Non-admins get empty result
    RETURN;
  END IF;
END;
$$;