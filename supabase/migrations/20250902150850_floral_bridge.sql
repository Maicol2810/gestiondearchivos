/*
  # Create document management functions

  1. Functions
    - create_document: Create new document with proper permissions
    - update_document: Update existing document with proper permissions

  2. Security
    - Validates user permissions
    - Ensures users can only create/update documents in their dependencia
    - Admins have full access
*/

-- Function to create document
CREATE OR REPLACE FUNCTION public.create_document(
  document_data jsonb,
  user_id uuid,
  user_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_dependencia_id uuid;
  doc_dependencia_id uuid;
BEGIN
  -- Get user's dependencia
  SELECT p.dependencia_id INTO user_dependencia_id
  FROM profiles p
  WHERE p.id = user_id;

  -- Extract dependencia_id from document_data
  doc_dependencia_id := (document_data->>'dependencia_id')::uuid;

  -- Validate permissions
  IF user_role != 'Administrador' AND (user_dependencia_id IS NULL OR doc_dependencia_id != user_dependencia_id) THEN
    RAISE EXCEPTION 'No tienes permisos para crear documentos en esta dependencia';
  END IF;

  -- Insert document
  INSERT INTO documentos (
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
    document_data->>'nombre',
    document_data->>'codigo_unico',
    (document_data->>'dependencia_id')::uuid,
    (document_data->>'serie_id')::uuid,
    (document_data->>'subserie_id')::uuid,
    CASE 
      WHEN document_data->>'fecha_creacion_documento' != '' 
      THEN (document_data->>'fecha_creacion_documento')::date 
      ELSE NULL 
    END,
    document_data->>'ubicacion_fisica',
    (document_data->>'soporte')::document_support,
    (document_data->>'estado')::document_status,
    document_data->>'observaciones',
    document_data->>'archivo_nombre',
    document_data->>'archivo_url',
    user_id
  );
END;
$$;

-- Function to update document
CREATE OR REPLACE FUNCTION public.update_document(
  document_id uuid,
  document_data jsonb,
  user_id uuid,
  user_role text
)
RETURNS void
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

  -- Validate permissions
  IF user_role != 'Administrador' AND (
    user_dependencia_id IS NULL OR 
    doc_dependencia_id != user_dependencia_id OR
    doc_created_by != user_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para modificar este documento';
  END IF;

  -- Update document
  UPDATE documentos SET
    nombre = document_data->>'nombre',
    codigo_unico = document_data->>'codigo_unico',
    dependencia_id = (document_data->>'dependencia_id')::uuid,
    serie_id = (document_data->>'serie_id')::uuid,
    subserie_id = (document_data->>'subserie_id')::uuid,
    fecha_creacion_documento = CASE 
      WHEN document_data->>'fecha_creacion_documento' != '' 
      THEN (document_data->>'fecha_creacion_documento')::date 
      ELSE NULL 
    END,
    ubicacion_fisica = document_data->>'ubicacion_fisica',
    soporte = (document_data->>'soporte')::document_support,
    estado = (document_data->>'estado')::document_status,
    observaciones = document_data->>'observaciones',
    archivo_nombre = COALESCE(document_data->>'archivo_nombre', archivo_nombre),
    archivo_url = COALESCE(document_data->>'archivo_url', archivo_url),
    updated_at = now()
  WHERE id = document_id;
END;
$$;