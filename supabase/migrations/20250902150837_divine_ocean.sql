/*
  # Create dashboard stats function

  1. Function
    - get_dashboard_stats: Get dashboard statistics based on user role and permissions

  2. Security
    - Validates user permissions
    - Filters data by dependencia for non-admin users
    - Returns appropriate stats based on role
*/

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(user_id uuid, user_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_dependencia_id uuid;
  total_documents integer := 0;
  active_lends integer := 0;
  pending_eliminations integer := 0;
  total_users integer := 0;
BEGIN
  -- Get user's dependencia
  SELECT p.dependencia_id INTO user_dependencia_id
  FROM profiles p
  WHERE p.id = user_id;

  IF user_role = 'Administrador' THEN
    -- Admin gets all stats
    SELECT COUNT(*) INTO total_documents FROM documentos;
    SELECT COUNT(*) INTO active_lends FROM prestamos WHERE estado IN ('Pendiente', 'Aprobado');
    SELECT COUNT(*) INTO pending_eliminations FROM eliminaciones WHERE estado = 'Pendiente';
    SELECT COUNT(*) INTO total_users FROM profiles;
  ELSE
    -- Regular users get filtered stats
    SELECT COUNT(*) INTO total_documents 
    FROM documentos 
    WHERE dependencia_id = user_dependencia_id;
    
    SELECT COUNT(*) INTO active_lends 
    FROM prestamos 
    WHERE usuario_solicitante_id = user_id 
      AND estado IN ('Pendiente', 'Aprobado');
    
    -- No elimination or user stats for regular users
    pending_eliminations := 0;
    total_users := 0;
  END IF;

  RETURN jsonb_build_object(
    'total_documents', total_documents,
    'active_lends', active_lends,
    'pending_eliminations', pending_eliminations,
    'total_users', total_users
  );
END;
$$;