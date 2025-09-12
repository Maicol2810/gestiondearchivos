import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  nombre_completo: string;
  rol: string;
}

interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
  error?: string;
}

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay una sesión activa en localStorage
    const sessionData = localStorage.getItem('user_session');
    if (sessionData) {
      try {
        const { user, timestamp } = JSON.parse(sessionData);
        // Verificar que la sesión no sea muy antigua (24 horas)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000 && user) {
          navigate("/dashboard");
        } else {
          localStorage.removeItem('user_session');
        }
      } catch (error) {
        localStorage.removeItem('user_session');
      }
    }
  }, [navigate]);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        user_email: email,
        user_password: password
      });

      if (error) {
        toast({
          title: "Error en el sistema",
          description: "Error interno del sistema",
          variant: "destructive"
        });
        return;
      }

      const authData = data as unknown as AuthResponse;

      if (!authData.success) {
        toast({
          title: "Error en el inicio de sesión",
          description: authData.message || "Credenciales incorrectas",
          variant: "destructive"
        });
        return;
      }

      // Guardar información del usuario en localStorage
      localStorage.setItem('user_session', JSON.stringify({
        user: authData.user,
        timestamp: Date.now()
      }));

      // Establecer sesión de Supabase para RLS
      await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      // Redirigir al dashboard
      navigate("/dashboard");
      
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/5a91f547-910d-4074-9213-cce908063776.png" 
              alt="UIPCA Logo" 
              className="h-20 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Sistema de Archivo</CardTitle>
          <CardDescription>Corporación Universitaria Politécnico Costa Atlántica</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
          
          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Creador: Joan Torres © 2025
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}