-- Add foreign key constraint between documentos.created_by and profiles.id
ALTER TABLE public.documentos 
ADD CONSTRAINT fk_documentos_created_by_profiles 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);