-- Crear tabla consultas para el módulo de consultas
CREATE TABLE public.consultas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL,
    tipo_consulta TEXT NOT NULL,
    asunto TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    nivel_urgencia TEXT NOT NULL DEFAULT 'Baja',
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    respuesta TEXT,
    respondido_por UUID,
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- Políticas para consultas
CREATE POLICY "Los usuarios pueden crear consultas" 
ON public.consultas 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Los usuarios pueden ver sus propias consultas" 
ON public.consultas 
FOR SELECT 
USING (auth.uid() = usuario_id OR is_admin(auth.uid()));

CREATE POLICY "Solo administradores pueden actualizar consultas" 
ON public.consultas 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_consultas_updated_at
    BEFORE UPDATE ON public.consultas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();