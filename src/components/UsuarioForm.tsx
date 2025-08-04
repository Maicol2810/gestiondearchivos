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
    activo: usuario?.activo ?? true
  });
  const [generatedPassword, setGeneratedPassword] = useState("");
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    return password;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Contraseña copiada al portapapeles"
    });
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
        toast({ title: "Usuario actualizado correctamente" });
      } else {
        // Crear nuevo usuario
        const password = generatePassword();
        
        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            nombre_completo: formData.nombre_completo
          }
        });

        if (authError) throw authError;

        // Actualizar perfil con datos adicionales
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            nombre_completo: formData.nombre_completo,
            rol: formData.rol,
            dependencia_id: formData.dependencia_id,
            activo: formData.activo
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        toast({ 
          title: "Usuario creado correctamente",
          description: `Contraseña generada: ${password}`
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

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => handleInputChange("activo", checked)}
              />
              <Label htmlFor="activo">Usuario activo</Label>
            </div>
          </div>

          {!usuario && generatedPassword && (
            <div className="p-4 bg-muted rounded-lg">
              <Label>Contraseña generada:</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={generatedPassword}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Guarda esta contraseña de forma segura. El usuario deberá cambiarla en su primer acceso.
              </p>
            </div>
          )}

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