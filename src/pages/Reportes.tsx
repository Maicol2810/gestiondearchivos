import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  FileText, 
  Download,
  Calendar,
  PieChart,
  TrendingUp,
  Users,
  Clock,
  Archive
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Reportes() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    documentos: {
      total: 0,
      activos: 0,
      digitales: 0,
      fisicos: 0,
      porDependencia: []
    },
    prestamos: {
      total: 0,
      pendientes: 0,
      aprobados: 0,
      devueltos: 0,
      porMes: []
    },
    usuarios: {
      total: 0,
      activos: 0,
      administradores: 0,
      porDependencia: []
    },
    consultas: {
      total: 0,
      pendientes: 0,
      respondidas: 0,
      porTipo: []
    }
  });
  const [selectedReport, setSelectedReport] = useState("documentos");
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Fetch documentos data
      let documentosQuery = supabase
        .from('documentos')
        .select('id, estado, soporte, dependencia_id, dependencias(nombre)');

      // Si no es administrador, filtrar por dependencia
      if (user.rol !== 'Administrador' && user.dependencia_id) {
        documentosQuery = documentosQuery.eq('dependencia_id', user.dependencia_id);
      }

      const { data: documentos } = await documentosQuery;

      // Fetch prestamos data
      let prestamosQuery = supabase
        .from('prestamos')
        .select('id, estado, created_at');

      // Si no es administrador, filtrar por usuario
      if (user.rol !== 'Administrador') {
        prestamosQuery = prestamosQuery.eq('usuario_solicitante_id', user.id);
      }

      const { data: prestamos } = await prestamosQuery;

      // Fetch usuarios data
      let usuarios = [];
      if (user.rol === 'Administrador') {
        const { data } = await supabase
          .from('profiles')
          .select('id, activo, rol, dependencia_id, dependencias(nombre)');
        usuarios = data || [];
      }

      // Process documentos data
      const docData = {
        total: documentos?.length || 0,
        activos: documentos?.filter(d => d.estado === 'Activo').length || 0,
        digitales: documentos?.filter(d => d.soporte === 'Digital').length || 0,
        fisicos: documentos?.filter(d => d.soporte === 'Papel').length || 0,
        porDependencia: []
      };

      // Process prestamos data
      const prestData = {
        total: prestamos?.length || 0,
        pendientes: prestamos?.filter(p => p.estado === 'Pendiente').length || 0,
        aprobados: prestamos?.filter(p => p.estado === 'Aprobado').length || 0,
        devueltos: prestamos?.filter(p => p.estado === 'Devuelto').length || 0,
        porMes: []
      };

      // Process usuarios data
      const userData = {
        total: usuarios?.length || 0,
        activos: usuarios?.filter(u => u.activo).length || 0,
        administradores: usuarios?.filter(u => u.rol === 'Administrador').length || 0,
        porDependencia: []
      };

      setReportData({
        documentos: docData,
        prestamos: prestData,
        usuarios: userData,
        consultas: {
          total: 0,
          pendientes: 0,
          respondidas: 0,
          porTipo: []
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del reporte",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `reporte_${selectedReport}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'documentos':
        const docData = reportData.documentos;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{docData.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Archive className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold">{docData.activos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Digitales</p>
                    <p className="text-2xl font-bold">{docData.digitales}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <PieChart className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Físicos</p>
                    <p className="text-2xl font-bold">{docData.fisicos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'prestamos':
        const prestData = reportData.prestamos;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Préstamos</p>
                    <p className="text-2xl font-bold">{prestData.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold">{prestData.pendientes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aprobados</p>
                    <p className="text-2xl font-bold">{prestData.aprobados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Archive className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Devueltos</p>
                    <p className="text-2xl font-bold">{prestData.devueltos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'usuarios':
        const userData = reportData.usuarios;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                    <p className="text-2xl font-bold">{userData.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold">{userData.activos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                    <p className="text-2xl font-bold">{userData.administradores}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <div>Selecciona un tipo de reporte</div>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Reportes</h2>
            <p className="text-muted-foreground">Estadísticas y reportes del sistema</p>
          </div>
          <Button onClick={exportReport} className="hover-lift">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>

        {/* Report Type Selector */}
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleccionar tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documentos">Documentos</SelectItem>
                  <SelectItem value="prestamos">Préstamos</SelectItem>
                  <SelectItem value="usuarios">Usuarios</SelectItem>
                  <SelectItem value="consultas">Consultas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Reporte de {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderReportContent()
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}