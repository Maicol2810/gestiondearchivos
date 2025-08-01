import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Check, 
  X,
  Clock,
  BookOpen,
  Calendar,
  User,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("");
  const [formData, setFormData] = useState({
    documento_id: "",
    motivo_prestamo: "",
    fecha_devolucion_programada: "",
    observaciones: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .single();
      setUserRole(data?.rol || '');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch préstamos
      const { data: prestamosData, error: prestamosError } = await supabase
        .from('prestamos')
        .select(`
          *,
          documentos(nombre, codigo_unico),
          profiles(nombre_completo)
        `)
        .order('created_at', { ascending: false });

      if (prestamosError) throw prestamosError;
      setPrestamos(prestamosData || []);

      // Fetch documentos disponibles
      const { data: documentosData, error: documentosError } = await supabase
        .from('documentos')
        .select('id, nombre, codigo_unico')
        .eq('estado', 'Activo')
        .order('nombre');

      if (documentosError) throw documentosError;
      setDocumentos(documentosData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from('prestamos')
        .insert([{
          ...formData,
          usuario_solicitante_id: user.id,
          fecha_devolucion_programada: formData.fecha_devolucion_programada ? new Date(formData.fecha_devolucion_programada).toISOString() : null
        }]);

      if (error) throw error;
      
      toast({ title: "Préstamo solicitado correctamente" });
      setShowForm(false);
      setFormData({
        documento_id: "",
        motivo_prestamo: "",
        fecha_devolucion_programada: "",
        observaciones: ""
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (prestamoId: string, newStatus: string) => {
    try {
      const updateData: any = { estado: newStatus };
      
      if (newStatus === 'Aprobado') {
        updateData.fecha_entrega = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.aprobado_por = user?.id;
      } else if (newStatus === 'Devuelto') {
        updateData.fecha_devolucion_real = new Date().toISOString();
      }

      const { error } = await supabase
        .from('prestamos')
        .update(updateData)
        .eq('id', prestamoId);

      if (error) throw error;
      
      toast({ title: `Préstamo ${newStatus.toLowerCase()} correctamente` });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      Pendiente: { variant: "outline", color: "text-yellow-600", icon: Clock },
      Aprobado: { variant: "default", color: "text-green-600", icon: Check },
      Rechazado: { variant: "destructive", color: "text-red-600", icon: X },
      Devuelto: { variant: "secondary", color: "text-blue-600", icon: BookOpen }
    };
    const config = variants[estado as keyof typeof variants];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {estado}
      </Badge>
    );
  };

  const filteredPrestamos = prestamos.filter((prestamo: any) =>
    prestamo.documentos?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestamo.documentos?.codigo_unico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestamo.profiles?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estadisticas = {
    total: prestamos.length,
    pendientes: prestamos.filter((p: any) => p.estado === 'Pendiente').length,
    aprobados: prestamos.filter((p: any) => p.estado === 'Aprobado').length,
    devueltos: prestamos.filter((p: any) => p.estado === 'Devuelto').length
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Préstamos</h2>
            <p className="text-muted-foreground">Gestión de préstamos documentales</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="hover-lift animate-pulse-glow">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="documento_id">Documento</Label>
                  <Select
                    value={formData.documento_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, documento_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar documento" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentos.map((doc: any) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.codigo_unico} - {doc.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="motivo_prestamo">Motivo del Préstamo</Label>
                  <Textarea
                    id="motivo_prestamo"
                    value={formData.motivo_prestamo}
                    onChange={(e) => setFormData(prev => ({ ...prev, motivo_prestamo: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fecha_devolucion_programada">Fecha de Devolución Programada</Label>
                  <Input
                    type="date"
                    id="fecha_devolucion_programada"
                    value={formData.fecha_devolucion_programada}
                    onChange={(e) => setFormData(prev => ({ ...prev, fecha_devolucion_programada: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Solicitar Préstamo
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                  <p className="text-sm text-muted-foreground">Total Préstamos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-8 w-8 text-yellow-500" />
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
                <Check className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.aprobados}</p>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.devueltos}</p>
                  <p className="text-sm text-muted-foreground">Devueltos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar préstamos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de préstamos */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Lista de Préstamos</CardTitle>
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
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Fecha Solicitud</TableHead>
                      <TableHead>Fecha Devolución</TableHead>
                      <TableHead>Estado</TableHead>
                      {userRole === 'Administrador' && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrestamos.map((prestamo: any) => (
                      <TableRow key={prestamo.id} className="hover:bg-accent/50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-medium">{prestamo.documentos?.codigo_unico}</p>
                            <p className="text-sm text-muted-foreground">{prestamo.documentos?.nombre}</p>
                          </div>
                        </TableCell>
                        <TableCell>{prestamo.profiles?.nombre_completo}</TableCell>
                        <TableCell className="max-w-xs truncate">{prestamo.motivo_prestamo}</TableCell>
                        <TableCell>{new Date(prestamo.fecha_solicitud).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {prestamo.fecha_devolucion_programada 
                            ? new Date(prestamo.fecha_devolucion_programada).toLocaleDateString()
                            : 'No especificada'
                          }
                        </TableCell>
                        <TableCell>{getEstadoBadge(prestamo.estado)}</TableCell>
                        {userRole === 'Administrador' && (
                          <TableCell>
                            {prestamo.estado === 'Pendiente' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(prestamo.id, 'Aprobado')}
                                  className="hover-lift"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStatusChange(prestamo.id, 'Rechazado')}
                                  className="hover-lift"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {prestamo.estado === 'Aprobado' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(prestamo.id, 'Devuelto')}
                                className="hover-lift"
                              >
                                Marcar Devuelto
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredPrestamos.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron préstamos
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground border-t border-border mt-8">
          Creador: Joan Torres © 2025
        </div>
      </div>
    </Layout>
  );
}