/*
  # Create data access functions for custom authentication

  1. Functions
    - get_user_documents: Get documents based on user role and dependencia
    - get_all_users: Get all users (admin only)
    - get_user_prestamos: Get loans based on user permissions
    - get_available_documents: Get available documents for loans

  2. Security
    - Functions validate user permissions
    - Proper filtering by dependencia for non-admin users
    - Admin users get full access
*/

-- Function to get documents based on user permissions
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

-- Function to get user loans
CREATE OR REPLACE FUNCTION public.get_user_prestamos(user_id uuid, user_role text)
RETURNS TABLE (
  id uuid,
  documento_id uuid,
  usuario_solicitante_id uuid,
  fecha_solicitud timestamptz,
  fecha_entrega timestamptz,
  fecha_devolucion_programada timestamptz,
  fecha_devolucion_real timestamptz,
  estado loan_status,
  motivo_prestamo text,
  observaciones text,
  aprobado_por uuid,
  created_at timestamptz,
  updated_at timestamptz,
  documentos jsonb,
  profiles jsonb
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

  IF user_role = 'Administrador' THEN
    -- Admin can see all loans
    RETURN QUERY
    SELECT 
      pr.id,
      pr.documento_id,
      pr.usuario_solicitante_id,
      pr.fecha_solicitud,
      pr.fecha_entrega,
      pr.fecha_devolucion_programada,
      pr.fecha_devolucion_real,
      pr.estado,
      pr.motivo_prestamo,
      pr.observaciones,
      pr.aprobado_por,
      pr.created_at,
      pr.updated_at,
      jsonb_build_object('nombre', d.nombre, 'codigo_unico', d.codigo_unico) as documentos,
      jsonb_build_object('nombre_completo', prof.nombre_completo) as profiles
    FROM prestamos pr
    LEFT JOIN documentos d ON pr.documento_id = d.id
    LEFT JOIN profiles prof ON pr.usuario_solicitante_id = prof.id
    ORDER BY pr.created_at DESC;
  ELSE
    -- Regular users see their own loans and loans for documents from their dependencia
    RETURN QUERY
    SELECT 
      pr.id,
      pr.documento_id,
      pr.usuario_solicitante_id,
      pr.fecha_solicitud,
      pr.fecha_entrega,
      pr.fecha_devolucion_programada,
      pr.fecha_devolucion_real,
      pr.estado,
      pr.motivo_prestamo,
      pr.observaciones,
      pr.aprobado_por,
      pr.created_at,
      pr.updated_at,
      jsonb_build_object('nombre', d.nombre, 'codigo_unico', d.codigo_unico) as documentos,
      jsonb_build_object('nombre_completo', prof.nombre_completo) as profiles
    FROM prestamos pr
    LEFT JOIN documentos d ON pr.documento_id = d.id
    LEFT JOIN profiles prof ON pr.usuario_solicitante_id = prof.id
    WHERE pr.usuario_solicitante_id = user_id 
       OR d.dependencia_id = user_dependencia_id
    ORDER BY pr.created_at DESC;
  END IF;
END;
$$;

-- Function to get available documents for loans
CREATE OR REPLACE FUNCTION public.get_available_documents(user_id uuid, user_role text)
RETURNS TABLE (
  id uuid,
  nombre text,
  codigo_unico text
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

  IF user_role = 'Administrador' THEN
    -- Admin can see all active documents
    RETURN QUERY
    SELECT d.id, d.nombre, d.codigo_unico
    FROM documentos d
    WHERE d.estado = 'Activo'
    ORDER BY d.nombre;
  ELSE
    -- Regular users see documents from their dependencia
    RETURN QUERY
    SELECT d.id, d.nombre, d.codigo_unico
    FROM documentos d
    WHERE d.estado = 'Activo' 
      AND d.dependencia_id = user_dependencia_id
    ORDER BY d.nombre;
  END IF;
END;
$$;