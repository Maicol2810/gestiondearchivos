-- Crear tipos enumerados
CREATE TYPE public.document_status AS ENUM ('Activo', 'Transferido', 'Eliminado');
CREATE TYPE public.document_support AS ENUM ('Papel', 'Digital');
CREATE TYPE public.loan_status AS ENUM ('Pendiente', 'Aprobado', 'Devuelto', 'Rechazado');
CREATE TYPE public.elimination_status AS ENUM ('Pendiente', 'En_revision', 'Eliminado');
CREATE TYPE public.user_role AS ENUM ('Administrador', 'Usuario_solicitante', 'Consultor');

-- Tabla de dependencias
CREATE TABLE public.dependencias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de series documentales
CREATE TABLE public.series_documentales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tiempo_retencion_anos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de subseries documentales
CREATE TABLE public.subseries_documentales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    serie_id UUID NOT NULL REFERENCES public.series_documentales(id) ON DELETE CASCADE,
    tiempo_retencion_anos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol user_role NOT NULL DEFAULT 'Usuario_solicitante',
    dependencia_id UUID REFERENCES public.dependencias(id),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de documentos
CREATE TABLE public.documentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_unico TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    serie_id UUID NOT NULL REFERENCES public.series_documentales(id),
    subserie_id UUID NOT NULL REFERENCES public.subseries_documentales(id),
    dependencia_id UUID NOT NULL REFERENCES public.dependencias(id),
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_documental TEXT NOT NULL,
    soporte document_support NOT NULL DEFAULT 'Papel',
    ubicacion_fisica TEXT,
    estado document_status NOT NULL DEFAULT 'Activo',
    observaciones TEXT,
    archivo_url TEXT,
    archivo_nombre TEXT,
    palabras_clave TEXT[],
    fecha_creacion_documento DATE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de préstamos
CREATE TABLE public.prestamos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
    usuario_solicitante_id UUID NOT NULL REFERENCES auth.users(id),
    fecha_solicitud TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    fecha_devolucion_programada TIMESTAMP WITH TIME ZONE,
    fecha_devolucion_real TIMESTAMP WITH TIME ZONE,
    estado loan_status NOT NULL DEFAULT 'Pendiente',
    motivo_prestamo TEXT NOT NULL,
    observaciones TEXT,
    aprobado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de eliminaciones documentales
CREATE TABLE public.eliminaciones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
    fecha_programada_eliminacion DATE NOT NULL,
    responsable_id UUID NOT NULL REFERENCES auth.users(id),
    estado elimination_status NOT NULL DEFAULT 'Pendiente',
    observaciones TEXT,
    acta_eliminacion_url TEXT,
    fecha_eliminacion_real TIMESTAMP WITH TIME ZONE,
    aprobado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear buckets de storage
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('actas-eliminacion', 'actas-eliminacion', false);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.dependencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_documentales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subseries_documentales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eliminaciones ENABLE ROW LEVEL SECURITY;

-- Función para obtener el rol del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT rol FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función para verificar si es administrador
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND rol = 'Administrador'
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas RLS para dependencias
CREATE POLICY "Todos pueden ver dependencias" ON public.dependencias FOR SELECT USING (true);
CREATE POLICY "Solo administradores pueden modificar dependencias" ON public.dependencias FOR ALL USING (public.is_admin(auth.uid()));

-- Políticas RLS para series documentales
CREATE POLICY "Todos pueden ver series" ON public.series_documentales FOR SELECT USING (true);
CREATE POLICY "Solo administradores pueden modificar series" ON public.series_documentales FOR ALL USING (public.is_admin(auth.uid()));

-- Políticas RLS para subseries documentales
CREATE POLICY "Todos pueden ver subseries" ON public.subseries_documentales FOR SELECT USING (true);
CREATE POLICY "Solo administradores pueden modificar subseries" ON public.subseries_documentales FOR ALL USING (public.is_admin(auth.uid()));

-- Políticas RLS para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Los administradores pueden ver todos los perfiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Solo administradores pueden crear perfiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Solo administradores pueden eliminar perfiles" ON public.profiles FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas RLS para documentos
CREATE POLICY "Usuarios autenticados pueden ver documentos" ON public.documentos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Administradores y usuarios solicitantes pueden crear documentos" ON public.documentos FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
        public.get_user_role(auth.uid()) = 'Administrador' OR
        public.get_user_role(auth.uid()) = 'Usuario_solicitante'
    )
);
CREATE POLICY "Solo administradores pueden modificar documentos" ON public.documentos FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Solo administradores pueden eliminar documentos" ON public.documentos FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas RLS para préstamos
CREATE POLICY "Los usuarios pueden ver sus propios préstamos" ON public.prestamos FOR SELECT USING (
    auth.uid() = usuario_solicitante_id OR public.is_admin(auth.uid())
);
CREATE POLICY "Los usuarios pueden crear préstamos" ON public.prestamos FOR INSERT WITH CHECK (
    auth.uid() = usuario_solicitante_id AND auth.uid() IS NOT NULL
);
CREATE POLICY "Solo administradores pueden actualizar préstamos" ON public.prestamos FOR UPDATE USING (public.is_admin(auth.uid()));

-- Políticas RLS para eliminaciones
CREATE POLICY "Solo administradores pueden ver eliminaciones" ON public.eliminaciones FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Solo administradores pueden crear eliminaciones" ON public.eliminaciones FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Solo administradores pueden modificar eliminaciones" ON public.eliminaciones FOR ALL USING (public.is_admin(auth.uid()));

-- Políticas de Storage
CREATE POLICY "Usuarios autenticados pueden ver documentos" ON storage.objects FOR SELECT USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Administradores y usuarios solicitantes pueden subir documentos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documentos' AND auth.uid() IS NOT NULL AND (
        public.get_user_role(auth.uid()) = 'Administrador' OR
        public.get_user_role(auth.uid()) = 'Usuario_solicitante'
    )
);
CREATE POLICY "Solo administradores pueden eliminar documentos" ON storage.objects FOR DELETE USING (
    bucket_id = 'documentos' AND public.is_admin(auth.uid())
);

CREATE POLICY "Solo administradores pueden ver actas" ON storage.objects FOR SELECT USING (bucket_id = 'actas-eliminacion' AND public.is_admin(auth.uid()));
CREATE POLICY "Solo administradores pueden subir actas" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'actas-eliminacion' AND public.is_admin(auth.uid()));

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_dependencias_updated_at BEFORE UPDATE ON public.dependencias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON public.series_documentales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subseries_updated_at BEFORE UPDATE ON public.subseries_documentales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prestamos_updated_at BEFORE UPDATE ON public.prestamos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_eliminaciones_updated_at BEFORE UPDATE ON public.eliminaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nombre_completo, rol)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
        'Usuario_solicitante'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertar datos iniciales
INSERT INTO public.dependencias (nombre, codigo) VALUES
    ('Dirección General', 'DG'),
    ('Recursos Humanos', 'RH'),
    ('Contabilidad', 'CONT'),
    ('Archivo Central', 'AC'),
    ('Sistemas', 'SIS');

INSERT INTO public.series_documentales (codigo, nombre, descripcion, tiempo_retencion_anos) VALUES
    ('AC', 'Actas', 'Actas de reuniones y sesiones', 10),
    ('CO', 'Correspondencia', 'Correspondencia oficial', 5),
    ('IF', 'Informes', 'Informes técnicos y administrativos', 7),
    ('CT', 'Contratos', 'Contratos y convenios', 15),
    ('NM', 'Nóminas', 'Nóminas y liquidaciones', 30);

INSERT INTO public.subseries_documentales (codigo, nombre, serie_id, tiempo_retencion_anos) VALUES
    ('AC-01', 'Actas de Comité Directivo', (SELECT id FROM public.series_documentales WHERE codigo = 'AC'), 10),
    ('AC-02', 'Actas de Junta', (SELECT id FROM public.series_documentales WHERE codigo = 'AC'), 10),
    ('CO-01', 'Correspondencia Recibida', (SELECT id FROM public.series_documentales WHERE codigo = 'CO'), 5),
    ('CO-02', 'Correspondencia Enviada', (SELECT id FROM public.series_documentales WHERE codigo = 'CO'), 5),
    ('IF-01', 'Informes de Gestión', (SELECT id FROM public.series_documentales WHERE codigo = 'IF'), 7),
    ('CT-01', 'Contratos de Prestación de Servicios', (SELECT id FROM public.series_documentales WHERE codigo = 'CT'), 15),
    ('NM-01', 'Nóminas Mensuales', (SELECT id FROM public.series_documentales WHERE codigo = 'NM'), 30);