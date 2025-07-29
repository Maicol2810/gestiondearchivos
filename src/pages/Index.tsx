import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Users, BarChart3 } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Sistema de Inventario Documental
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Gestiona, controla y administra tu archivo documental de manera eficiente y segura
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-3"
            >
              Acceder al Sistema
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Funcionalidades Principales
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un sistema completo para la gestión archivística que cumple con las normas y 
              estándares de la gestión documental moderna
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Inventario Documental</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Registro completo de documentos físicos y digitales con clasificación 
                  automática por series y subseries
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Control de Préstamos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Gestión segura de préstamos con seguimiento completo del historial 
                  y validación de disponibilidad
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Gestión de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Roles diferenciados para administradores, usuarios solicitantes 
                  y consultores con permisos específicos
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Reportes y Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generación de reportes detallados y gráficas para el análisis 
                  y toma de decisiones
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ¿Listo para modernizar tu archivo?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Únete al sistema y comienza a gestionar tu inventario documental 
            de manera profesional y eficiente
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-3"
          >
            Comenzar Ahora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Sistema de Inventario Documental. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
