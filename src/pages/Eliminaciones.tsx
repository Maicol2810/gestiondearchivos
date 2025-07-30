import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar, FileText, AlertTriangle } from "lucide-react";

export default function Eliminaciones() {
  const [eliminaciones, setEliminaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEliminaciones();
  }, []);

  const fetchEliminaciones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('eliminaciones')
        .select(`
          *,
          documentos(nombre, codigo_unico),
          profiles!eliminaciones_responsable_id_fkey(nombre_completo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEliminaciones(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las eliminaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      Pendiente: "outline",
      Completada: "default",
      Cancelada: "destructive"
    };
    return <Badge variant={variants[estado as keyof typeof variants] as any}>{estado}</Badge>;
  };

  const estadisticas = {
    total: eliminaciones.length,
    pendientes: eliminaciones.filter((e: any) => e.estado === 'Pendiente').length,
    completadas: eliminaciones.filter((e: any) => e.estado === 'Completada').length
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Eliminaciones</h2>
          <p className="text-muted-foreground">Gestión de eliminación documental</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                  <p className="text-sm text-muted-foreground">Total Eliminaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.pendientes}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.completadas}</p>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de eliminaciones */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Lista de Eliminaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Fecha Programada</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Real</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eliminaciones.map((eliminacion: any) => (
                      <TableRow key={eliminacion.id} className="hover:bg-accent/50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-medium">{eliminacion.documentos?.codigo_unico}</p>
                            <p className="text-sm text-muted-foreground">{eliminacion.documentos?.nombre}</p>
                          </div>
                        </TableCell>
                        <TableCell>{eliminacion.profiles?.nombre_completo}</TableCell>
                        <TableCell>{new Date(eliminacion.fecha_programada_eliminacion).toLocaleDateString()}</TableCell>
                        <TableCell>{getEstadoBadge(eliminacion.estado)}</TableCell>
                        <TableCell>
                          {eliminacion.fecha_eliminacion_real 
                            ? new Date(eliminacion.fecha_eliminacion_real).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {eliminaciones.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron eliminaciones
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}