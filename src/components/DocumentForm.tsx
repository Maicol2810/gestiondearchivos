import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

interface DocumentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  document?: any;
}

export default function DocumentForm({ onSuccess, onCancel, document }: DocumentFormProps) {
  const [loading, setLoading] = useState(false);
  const [dependencias, setDependencias] = useState([]);
  const [series, setSeries] = useState([]);
  const [subseries, setSubseries] = useState([]);
  const [selectedSerie, setSelectedSerie] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      nombre: document?.nombre || "",
      codigo_unico: document?.codigo_unico || "",
      dependencia_id: document?.dependencia_id || "",
      serie_id: document?.serie_id || "",
      subserie_id: document?.subserie_id || "",
      fecha_creacion_documento: document?.fecha_creacion_documento || "",
      ubicacion_fisica: document?.ubicacion_fisica || "",
      soporte: document?.soporte || "Papel",
      estado: document?.estado || "Activo",
      observaciones: document?.observaciones || ""
    }
  });

  useEffect(() => {
    fetchUserProfile();
    if (document) {
      setValue("dependencia_id", document.dependencia_id);
      setValue("serie_id", document.serie_id);
      setValue("soporte", document.soporte);
      setValue("estado", document.estado);
      setSelectedSerie(document.serie_id);
    }
  }, [document, setValue]);

  useEffect(() => {
    fetchUserProfile();
    fetchDependencias();
    fetchSeries();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchDependencias();
    }
  }, [userProfile]);

  useEffect(() => {
    if (selectedSerie) {
      fetchSubseries(selectedSerie);
    }
  }, [selectedSerie]);

  const fetchUserProfile = async () => {
    const user = getCurrentUser();
    if (user) {
      setUserProfile(user);
      
      // Si el usuario no es administrador, auto-seleccionar su dependencia
      if (user && user.rol !== 'Administrador' && user.dependencia_id && !document) {
        setValue("dependencia_id", user.dependencia_id);
      }
    }
  };

  const fetchDependencias = async () => {
    if (!userProfile) return;
    
    const { data, error } = await supabase
      .from('dependencias')
      .select('*')
      .order('nombre');
    
    if (!error) {
      // Si el usuario no es administrador, solo mostrar su dependencia
      if (userProfile.rol !== 'Administrador' && userProfile.dependencia_id) {
        const userDependencias = data?.filter(dep => dep.id === userProfile.dependencia_id) || [];
        setDependencias(userDependencias);
      } else {
        setDependencias(data || []);
      }
    }
  };

  const fetchSeries = async () => {
    const { data, error } = await supabase
      .from('series_documentales')
      .select('*')
      .order('nombre');
    
    if (!error) setSeries(data || []);
  };

  const fetchSubseries = async (serieId: string) => {
    const { data, error } = await supabase
      .from('subseries_documentales')
      .select('*')
      .eq('serie_id', serieId)
      .order('nombre');
    
    if (!error) setSubseries(data || []);
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `documentos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);

    return { fileName: file.name, url: publicUrl };
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      let archivoData = null;
      
      if (file) {
        archivoData = await uploadFile(file);
      }

      const documentData = {
        ...data,
        archivo_nombre: archivoData?.fileName,
        archivo_url: archivoData?.url,
        created_by: user.id
      };

      if (document) {
        // Usar función RPC para actualizar documento
        const { error } = await supabase.rpc('update_document', {
          document_id: document.id,
          document_data: documentData,
          user_id: user.id,
          user_role: user.rol
        });
        
        if (error) throw error;
        toast({ title: "Documento actualizado correctamente" });
      } else {
        // Usar función RPC para crear documento
        const { error } = await supabase.rpc('create_document', {
          document_data: documentData,
          user_id: user.id,
          user_role: user.rol
        });
        
        if (error) throw error;
        toast({ title: "Documento creado correctamente" });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle>{document ? "Editar Documento" : "Nuevo Documento"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre del Documento</Label>
              <Input
                id="nombre"
                {...register("nombre", { required: "Este campo es requerido" })}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="codigo_unico">Código Único</Label>
              <Input
                id="codigo_unico"
                {...register("codigo_unico", { required: "Este campo es requerido" })}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              {errors.codigo_unico && <p className="text-sm text-destructive">{errors.codigo_unico.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="dependencia_id">Dependencia</Label>
              <Select 
                value={watch("dependencia_id")} 
                onValueChange={(value) => setValue("dependencia_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar dependencia" />
                </SelectTrigger>
                <SelectContent>
                  {dependencias.map((dep: any) => (
                    <SelectItem key={dep.id} value={dep.id}>{dep.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="serie_id">Serie Documental</Label>
              <Select 
                value={watch("serie_id")} 
                onValueChange={(value) => {
                  setValue("serie_id", value);
                  setSelectedSerie(value);
                  setValue("subserie_id", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar serie" />
                </SelectTrigger>
                <SelectContent>
                  {series.map((serie: any) => (
                    <SelectItem key={serie.id} value={serie.id}>{serie.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subserie_id">Subserie Documental</Label>
              <Select 
                value={watch("subserie_id")} 
                onValueChange={(value) => setValue("subserie_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar subserie" />
                </SelectTrigger>
                <SelectContent>
                  {subseries.map((subserie: any) => (
                    <SelectItem key={subserie.id} value={subserie.id}>{subserie.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fecha_creacion_documento">Fecha de Creación</Label>
              <Input
                type="date"
                id="fecha_creacion_documento"
                {...register("fecha_creacion_documento")}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <Label htmlFor="ubicacion_fisica">Ubicación Física</Label>
              <Input
                id="ubicacion_fisica"
                {...register("ubicacion_fisica")}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <Label htmlFor="soporte">Soporte</Label>
              <Select 
                value={watch("soporte")} 
                onValueChange={(value) => setValue("soporte", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar soporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Papel">Papel</SelectItem>
                  <SelectItem value="Digital">Digital</SelectItem>
                  <SelectItem value="Microfilm">Microfilm</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select 
                value={watch("estado")} 
                onValueChange={(value) => setValue("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Transferido">Transferido</SelectItem>
                  <SelectItem value="Eliminado">Eliminado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              {...register("observaciones")}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <Label htmlFor="archivo">Archivo Digital</Label>
            <div className="mt-2">
              <input
                type="file"
                id="archivo"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
              />
              <label
                htmlFor="archivo"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                {file ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Haz clic para subir un archivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, etc.
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="hover-lift"
            >
              {loading ? "Guardando..." : document ? "Actualizar" : "Crear"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="hover-lift"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}