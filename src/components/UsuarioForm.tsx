import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Copy } from "lucide-react";

interface UsuarioFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  usuario?: any;
}

export default function UsuarioForm({ onSuccess, onCancel, usuario }: UsuarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [dependencias, setDependencias] = useState([]);
  const [formData, setFormData] = useState({
    nombre_completo: usuario?.nombre_completo || "",
    email: usuario?.email || "",
    rol: usuario?.rol || "Usuario",
    dependencia_id: usuario?.dependencia_id || "",
    activo: usuario?.activo ?? true,
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDependencias();
  }, []);

  const fetchDependencias = async () => {
    const { data, error } = await supabase
      .from('dependencias')
      .select('*')
      .order('nombre');
    
    if (!error) setDependencias(data || []);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (usuario) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from('profiles')
          .update({
            nombre_completo: formData.nombre_completo,
            rol: formData.rol,
            dependencia_id: formData.dependencia_id,
            activo: formData.activo
          })
          .eq('id', usuario.id);
        
        if (error) throw error;
        toast({ 
          title: "Éxito",
          description: "Usuario actualizado correctamente"
        });
      } else {
        // Crear nuevo usuario
        if (!formData.password) {
          toast({
            title: "Error",
            description: "La contraseña es requerida para crear un nuevo usuario",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // Crear usuario usando función personalizada
        const { data: result, error: createError } = await supabase.rpc('create_user_for_admin', {
          user_email: formData.email,
          user_password: formData.password,
          full_name: formData.nombre_completo,
          user_role: formData.rol,
          dep_id: formData.dependencia_id || null,
          is_active: formData.activo
        });

        if (createError) throw createError;
        
        const resultData = result as any;
        if (!resultData.success) {
          const errorMsg = resultData.error === 'ADMIN_REQUIRED' 
            ? "No tienes permisos de administrador para crear usuarios"
            : resultData.error === 'EMAIL_EXISTS'
            ? "Este email ya está registrado en el sistema"
            : resultData.message || "Error desconocido al crear el usuario";
          throw new Error(errorMsg);
        }

        toast({ 
          title: "Éxito",
          description: "Usuario creado correctamente"
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error in user form:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle>{usuario ? "Editar Usuario" : "Nuevo Usuario"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre_completo">Nombre Completo</Label>
              <Input
                id="nombre_completo"
                value={formData.nombre_completo}
                onChange={(e) => handleInputChange("nombre_completo", e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={!!usuario}
                required
              />
            </div>

            <div>
              <Label htmlFor="rol">Rol</Label>
              <Select 
                value={formData.rol} 
                onValueChange={(value) => handleInputChange("rol", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Usuario">Usuario</SelectItem>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dependencia_id">Dependencia</Label>
              <Select 
                value={formData.dependencia_id} 
                onValueChange={(value) => handleInputChange("dependencia_id", value)}
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

            {!usuario && (
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                    required={!usuario}
                    placeholder="Ingrese una contraseña segura"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Mínimo 8 caracteres. El usuario deberá cambiarla en su primer acceso.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => handleInputChange("activo", checked)}
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