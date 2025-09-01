import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import DocumentForm from "@/components/DocumentForm";
import AdvancedFilters from "@/components/AdvancedFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Edit, 
  Download,
  Trash2,
  MoreHorizontal,
  FileText,
  Filter,
  Eye,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Documentos() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    fetchDocumentos();
  }, []);

  const fetchDocumentos = async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      let query = supabase
        .from('documentos')
        .select(`
          *,
          dependencias(nombre),
          series_documentales(nombre),
          subseries_documentales(nombre),
          created_by_profile:profiles!created_by(nombre_completo)
        `);

      // Si no es administrador, filtrar por dependencia
      if (user.rol !== 'Administrador' && user.dependencia_id) {
        query = query.eq('dependencia_id', user.dependencia_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          dependencias(nombre),
          series_documentales(nombre),
          subseries_documentales(nombre),
          created_by_profile:profiles!created_by(nombre_completo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocumentos(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (url: string) => {
    if (url) {
      // Check if URL is accessible
      const img = new Image();
      img.onload = () => {
        setViewerUrl(url);
        setViewerOpen(true);
      };
      img.onerror = () => {
        // If image fails, try opening as PDF or direct link
        setViewerUrl(url);
        setViewerOpen(true);
      };
      img.src = url;
    } else {
      toast({
        title: "Error",
        description: "No hay archivo disponible para visualizar",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = (url: string, filename: string) => {
    if (url) {
      try {
        // Open in new tab for download
        window.open(url, '_blank', 'noopener,noreferrer');
        
        toast({
          title: "Descarga iniciada",
          description: "El archivo se abrió en una nueva pestaña"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo descargar el archivo",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: "No hay archivo disponible para descargar",
        variant: "destructive"
      });
    }
  };
  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', documentToDelete.id);

      if (error) throw error;
      
      toast({ title: "Documento eliminado correctamente" });
      fetchDocumentos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const filteredDocumentos = documentos.filter((doc: any) => {
    // Filtro de búsqueda básica
    const matchesSearch = doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.codigo_unico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.ubicacion_fisica && doc.ubicacion_fisica.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtros avanzados
    const matchesDependencia = !advancedFilters.dependencia || doc.dependencia_id === advancedFilters.dependencia;
    const matchesSerie = !advancedFilters.serie || doc.serie_id === advancedFilters.serie;
    const matchesSubserie = !advancedFilters.subserie || doc.subserie_id === advancedFilters.subserie;
    const matchesEstado = !advancedFilters.estado || doc.estado === advancedFilters.estado;
    const matchesSoporte = !advancedFilters.soporte || doc.soporte === advancedFilters.soporte;
    const matchesUbicacion = !advancedFilters.ubicacionFisica || 
      (doc.ubicacion_fisica && doc.ubicacion_fisica.toLowerCase().includes(advancedFilters.ubicacionFisica.toLowerCase()));
    
    // Filtros de fecha
    let matchesFechaDesde = true;
    let matchesFechaHasta = true;
    
    if (advancedFilters.fechaDesde) {
      matchesFechaDesde = new Date(doc.fecha_ingreso) >= new Date(advancedFilters.fechaDesde);
    }
    
    if (advancedFilters.fechaHasta) {
      matchesFechaHasta = new Date(doc.fecha_ingreso) <= new Date(advancedFilters.fechaHasta);
    }

    return matchesSearch && matchesDependencia && matchesSerie && matchesSubserie && 
           matchesEstado && matchesSoporte && matchesUbicacion && matchesFechaDesde && matchesFechaHasta;
  });

  const getEstadoBadge = (estado: string) => {
    const variants = {
      Activo: "default",
      Transferido: "secondary",
      Eliminado: "destructive"
    };
    return <Badge variant={variants[estado as keyof typeof variants] as any}>{estado}</Badge>;
  };

  const getSoporteBadge = (soporte: string) => {
    const variants = {
      Papel: "outline",
      Digital: "default",
      Microfilm: "secondary"
    };
    return <Badge variant={variants[soporte as keyof typeof variants] as any}>{soporte}</Badge>;
  };

  if (showForm) {
    return (
      <Layout>
        <div className="animate-fade-in">
          <DocumentForm
            document={editingDocument}
            onSuccess={() => {
              setShowForm(false);
              setEditingDocument(null);
              fetchDocumentos();
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingDocument(null);
            }}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Documentos</h2>
            <p className="text-muted-foreground">Gestión del inventario documental</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="hover-lift animate-pulse-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Documento
          </Button>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                className="hover-lift"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avanzados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filtros avanzados */}
        {showAdvancedFilters && (
          <AdvancedFilters
            onFiltersChange={setAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
          />
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{documentos.length}</p>
                  <p className="text-sm text-muted-foreground">Total Documentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{documentos.filter((d: any) => d.estado === 'Activo').length}</p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{documentos.filter((d: any) => d.soporte === 'Digital').length}</p>
                  <p className="text-sm text-muted-foreground">Digitales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift glass-effect">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{documentos.filter((d: any) => d.soporte === 'Papel').length}</p>
                  <p className="text-sm text-muted-foreground">Físicos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de documentos */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Lista de Documentos</CardTitle>
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
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Dependencia</TableHead>
                      <TableHead>Serie</TableHead>
                      <TableHead>Subserie</TableHead>
                      <TableHead>Ubicación Física</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Soporte</TableHead>
                      <TableHead>Creado por</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocumentos.map((documento: any) => (
                      <TableRow key={documento.id} className="hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium">{documento.codigo_unico}</TableCell>
                        <TableCell>{documento.nombre}</TableCell>
                        <TableCell>{documento.dependencias?.nombre}</TableCell>
                        <TableCell>{documento.series_documentales?.nombre}</TableCell>
                        <TableCell>{documento.subseries_documentales?.nombre || 'N/A'}</TableCell>
                        <TableCell>{documento.ubicacion_fisica || 'N/A'}</TableCell>
                        <TableCell>{getEstadoBadge(documento.estado)}</TableCell>
                        <TableCell>{getSoporteBadge(documento.soporte)}</TableCell>
                        <TableCell>{documento.created_by_profile?.nombre_completo || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {documento.archivo_url && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDocument(documento.archivo_url)}
                                  className="hover-lift text-primary hover:text-primary/80"
                                  title="Ver documento"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(documento.archivo_url, documento.archivo_nombre)}
                                  className="hover-lift text-green-600 hover:text-green-700"
                                  title="Descargar documento"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="hover-lift">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingDocument(documento);
                                    setShowForm(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {documento.archivo_url && (
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadDocument(documento.archivo_url, documento.archivo_nombre)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDocumentToDelete(documento);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredDocumentos.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron documentos
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visor de documentos */}
        {viewerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Visor de Documento</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 p-4">
                {viewerUrl && viewerUrl.toLowerCase().includes('.pdf') ? (
                  <iframe
                    src={viewerUrl}
                    className="w-full h-full border-0"
                    title="Documento PDF"
                  />
                ) : viewerUrl ? (
                  <img
                    src={viewerUrl}
                    alt="Documento"
                    className="max-w-full max-h-full object-contain mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<p class="text-center text-gray-500">No se puede mostrar el archivo. <a href="' + viewerUrl + '" target="_blank" class="text-blue-500 underline">Abrir en nueva pestaña</a></p>';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No hay archivo para mostrar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El documento será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}