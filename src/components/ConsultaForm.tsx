import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ConsultaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ConsultaForm({ onSuccess, onCancel }: ConsultaFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      tipo_consulta: "",
      asunto: "",
      descripcion: "",
      nivel_urgencia: "Baja"
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Por ahora simulamos la inserción hasta que la migración se procese
      console.log("Datos de consulta:", { ...data, usuario_id: user.id });
      
      toast({ title: "Consulta registrada correctamente (simulado)" });
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
        <CardTitle>Nueva Consulta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_consulta">Tipo de Consulta</Label>
              <Select onValueChange={(value) => register("tipo_consulta").onChange({ target: { value } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solicitud de Información">Solicitud de Información</SelectItem>
                  <SelectItem value="Consulta Técnica">Consulta Técnica</SelectItem>
                  <SelectItem value="Soporte">Soporte</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_consulta && <p className="text-sm text-destructive">{errors.tipo_consulta.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="nivel_urgencia">Nivel de Urgencia</Label>
              <Select onValueChange={(value) => register("nivel_urgencia").onChange({ target: { value } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baja">Baja</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="asunto">Asunto</Label>
            <Input
              id="asunto"
              {...register("asunto", { required: "Este campo es requerido" })}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
            {errors.asunto && <p className="text-sm text-destructive">{errors.asunto.message as string}</p>}
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register("descripcion", { required: "Este campo es requerido" })}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-24"
            />
            {errors.descripcion && <p className="text-sm text-destructive">{errors.descripcion.message as string}</p>}
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="hover-lift"
            >
              {loading ? "Enviando..." : "Enviar Consulta"}
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