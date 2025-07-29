import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BookOpen, Trash2, Users } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    activeLends: 0,
    pendingEliminations: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total documentos
      const { count: documentsCount } = await supabase
        .from('documentos')
        .select('*', { count: 'exact', head: true });

      // Préstamos activos
      const { count: lendsCount } = await supabase
        .from('prestamos')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['Pendiente', 'Aprobado']);

      // Eliminaciones pendientes
      const { count: eliminationsCount } = await supabase
        .from('eliminaciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Pendiente');

      // Total usuarios
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalDocuments: documentsCount || 0,
        activeLends: lendsCount || 0,
        pendingEliminations: eliminationsCount || 0,
        totalUsers: usersCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Resumen del sistema de inventario documental</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Documentos registrados en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.activeLends}</div>
              <p className="text-xs text-muted-foreground">
                Préstamos pendientes y aprobados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eliminaciones Pendientes</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.pendingEliminations}</div>
              <p className="text-xs text-muted-foreground">
                Documentos pendientes de eliminación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Rápido</CardTitle>
              <CardDescription>Funciones principales del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">Nuevo Documento</h3>
                  <p className="text-sm text-muted-foreground">Registrar documento</p>
                </div>
                <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">Solicitar Préstamo</h3>
                  <p className="text-sm text-muted-foreground">Nueva solicitud</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas actividades del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Sistema inicializado</p>
                    <p className="text-xs text-muted-foreground">Hace unos momentos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}