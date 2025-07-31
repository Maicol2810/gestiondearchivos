import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface UsuarioFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  usuario?: any;
}

export default function UsuarioForm({ onSuccess, onCancel, usuario }: UsuarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [dependencias, setDependencias] = useState([]);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      nombre_completo: usuario?.nombre_completo || "",
      email: usuario?.email || "",
      rol: usuario?.rol || "Usuario_solicitante",
      dependencia_id: usuario?.dependencia_id || "",
      activo: usuario?.activo ?? true
    }
  });

  useEffect(() => {
    fetchDependencias();
    if (usuario) {
      setValue("rol", usuario.rol);
      setValue("dependencia_id", usuario.dependencia_id);
      setValue("activo", usuario.activo);
    }
  }, [usuario, setValue]);

  const fetchDependencias = async () => {
    const { data, error } = await supabase
      .from('dependencias')
      .select('*')
      .order('nombre');
    
    if (!error) setDependencias(data || []);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (usuario) {
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', usuario.id);
        
        if (error) throw error;
        toast({ title: "Usuario actualizado correctamente" });
      } else {
        // Para crear usuarios, necesitaríamos auth.admin
        toast({ 
          title: "Información", 
          description: "Los usuarios deben registrarse por sí mismos",
          variant: "default"
        });
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
        <CardTitle>{usuario ? "Editar Usuario" : "Nuevo Usuario"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre_completo">Nombre Completo</Label>
              <Input
                id="nombre_completo"
                {...register("nombre_completo", { required: "Este campo es requerido" })}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              {errors.nombre_completo && <p className="text-sm text-destructive">{errors.nombre_completo.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { 
                  required: "Este campo es requerido",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Email no válido"
                  }
                })}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={!!usuario}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="rol">Rol</Label>
              <Select 
                value={watch("rol")} 
                onValueChange={(value) => setValue("rol", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Usuario_solicitante">Usuario Solicitante</SelectItem>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={watch("activo")}
                onCheckedChange={(checked) => setValue("activo", checked)}
              />
              <Label htmlFor="activo">Usuario activo</Label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="hover-lift"
            >
              {loading ? "Guardando..." : usuario ? "Actualizar" : "Crear"}
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