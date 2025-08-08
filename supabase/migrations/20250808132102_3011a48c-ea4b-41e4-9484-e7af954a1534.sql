-- Asegurar que pgcrypto está habilitado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Actualizar usuarios existentes con contraseñas hasheadas por defecto
UPDATE public.profiles SET 
  password_hash = crypt('123456', gen_salt('bf'))
WHERE password_hash IS NULL;

-- Asegurar que torresmaicol52@gmail.com sea administrador
UPDATE public.profiles SET 
  rol = 'Administrador'
WHERE email = 'torresmaicol52@gmail.com';