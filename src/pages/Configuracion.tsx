import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2,
  Building,
  FolderOpen,
  FileText,
  MoreHorizontal
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Configuracion() {
  const [dependencias, setDependencias] = useState([]);
  const [series, setSeries] = useState([]);
  const [subseries, setSubseries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDependenciaForm, setShowDependenciaForm] = useState(false);
  const [showSerieForm, setShowSerieForm] = useState(false);
  const [showSubserieForm, setShowSubserieForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { toast } = useToast();

  const [dependenciaForm, setDependenciaForm] = useState({
    nombre: "",
    codigo: ""
  });

  const [serieForm, setSerieForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    tiempo_retencion_anos: ""
  });

  const [subserieForm, setSubserieForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    serie_id: "",
    tiempo_retencion_anos: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDependencias(),
        fetchSeries(),
        fetchSubseries()
      ]);
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

  const fetchDependencias = async () => {
    const { data, error } = await supabase
      .from('dependencias')
      .select('*')
      .order('nombre');
    
    if (!error) setDependencias(data || []);
  };

  const fetchSeries = async () => {
    const { data, error } = await supabase
      .from('series_documentales')
      .select('*')
      .order('nombre');
    
    if (!error) setSeries(data || []);
  };

  const fetchSubseries = async () => {
    const { data, error } = await supabase
      .from('subseries_documentales')
      .select(`
        *,
        series_documentales(nombre)
      `)
      .order('nombre');
    
    if (!error) setSubseries(data || []);
  };

  // Funciones para Dependencias
  const handleDependenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('dependencias')
          .update(dependenciaForm)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast({ title: "Dependencia actualizada correctamente" });
      } else {
        const { error } = await supabase
          .from('dependencias')
          .insert([dependenciaForm]);
        
        if (error) throw error;
        toast({ title: "Dependencia creada correctamente" });
      }

      setShowDependenciaForm(false);
      setEditingItem(null);
      setDependenciaForm({ nombre: "", codigo: "" });
      fetchDependencias();
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

  const handleDeleteDependencia = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dependencias')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Dependencia eliminada correctamente" });
      fetchDependencias();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Funciones para Series
  const handleSerieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const serieData = {
        ...serieForm,
        tiempo_retencion_anos: serieForm.tiempo_retencion_anos ? parseInt(serieForm.tiempo_retencion_anos) : null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('series_documentales')
          .update(serieData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast({ title: "Serie documental actualizada correctamente" });
      } else {
        const { error } = await supabase
          .from('series_documentales')
          .insert([serieData]);
        
        if (error) throw error;
        toast({ title: "Serie documental creada correctamente" });
      }

      setShowSerieForm(false);
      setEditingItem(null);
      setSerieForm({ codigo: "", nombre: "", descripcion: "", tiempo_retencion_anos: "" });
      fetchSeries();
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

  // Funciones para Subseries
  const handleSubserieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subserieData = {
        ...subserieForm,
        tiempo_retencion_anos: subserieForm.tiempo_retencion_anos ? parseInt(subserieForm.tiempo_retencion_anos) : null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('subseries_documentales')
          .update(subserieData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast({ title: "Subserie documental actualizada correctamente" });
      } else {
        const { error } = await supabase
          .from('subseries_documentales')
          .insert([subserieData]);
        
        if (error) throw error;
        toast({ title: "Subserie documental creada correctamente" });
      }

      setShowSubserieForm(false);
      setEditingItem(null);
      setSubserieForm({ codigo: "", nombre: "", descripcion: "", serie_id: "", tiempo_retencion_anos: "" });
      fetchSubseries();
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
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Configuración del Sistema</h2>
          <p className="text-muted-foreground">Gestión de dependencias, series y subseries documentales</p>
        </div>

        <Tabs defaultValue="dependencias" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dependencias">Dependencias</TabsTrigger>
            <TabsTrigger value="series">Series Documentales</TabsTrigger>
            <TabsTrigger value="subseries">Subseries Documentales</TabsTrigger>
          </TabsList>

          {/* Tab Dependencias */}
          <TabsContent value="dependencias">
            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Dependencias
                  </CardTitle>
                </div>
                <Dialog open={showDependenciaForm} onOpenChange={setShowDependenciaForm}>
                  <DialogTrigger asChild>
                    <Button className="hover-lift">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Dependencia
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? 'Editar Dependencia' : 'Nueva Dependencia'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDependenciaSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={dependenciaForm.nombre}
                          onChange={(e) => setDependenciaForm(prev => ({ ...prev, nombre: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="codigo">Código</Label>
                        <Input
                          id="codigo"
                          value={dependenciaForm.codigo}
                          onChange={(e) => setDependenciaForm(prev => ({ ...prev, codigo: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={loading}>
                          {loading ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowDependenciaForm(false);
                            setEditingItem(null);
                            setDependenciaForm({ nombre: "", codigo: "" });
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dependencias.map((dep: any) => (
                      <TableRow key={dep.id}>
                        <TableCell className="font-medium">{dep.codigo}</TableCell>
                        <TableCell>{dep.nombre}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingItem(dep);
                                  setDependenciaForm({ nombre: dep.nombre, codigo: dep.codigo });
                                  setShowDependenciaForm(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteDependencia(dep.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Series */}
          <TabsContent value="series">
            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Series Documentales
                  </CardTitle>
                </div>
                <Dialog open={showSerieForm} onOpenChange={setShowSerieForm}>
                  <DialogTrigger asChild>
                    <Button className="hover-lift">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Serie
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? 'Editar Serie Documental' : 'Nueva Serie Documental'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSerieSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="codigo">Código</Label>
                          <Input
                            id="codigo"
                            value={serieForm.codigo}
                            onChange={(e) => setSerieForm(prev => ({ ...prev, codigo: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tiempo_retencion">Tiempo Retención (años)</Label>
                          <Input
                            id="tiempo_retencion"
                            type="number"
                            value={serieForm.tiempo_retencion_anos}
                            onChange={(e) => setSerieForm(prev => ({ ...prev, tiempo_retencion_anos: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={serieForm.nombre}
                          onChange={(e) => setSerieForm(prev => ({ ...prev, nombre: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          value={serieForm.descripcion}
                          onChange={(e) => setSerieForm(prev => ({ ...prev, descripcion: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={loading}>
                          {loading ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowSerieForm(false);
                            setEditingItem(null);
                            setSerieForm({ codigo: "", nombre: "", descripcion: "", tiempo_retencion_anos: "" });
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Retención (años)</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {series.map((serie: any) => (
                      <TableRow key={serie.id}>
                        <TableCell className="font-medium">{serie.codigo}</TableCell>
                        <TableCell>{serie.nombre}</TableCell>
                        <TableCell className="max-w-xs truncate">{serie.descripcion}</TableCell>
                        <TableCell>{serie.tiempo_retencion_anos || 'N/A'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingItem(serie);
                                  setSerieForm({
                                    codigo: serie.codigo,
                                    nombre: serie.nombre,
                                    descripcion: serie.descripcion || "",
                                    tiempo_retencion_anos: serie.tiempo_retencion_anos?.toString() || ""
                                  });
                                  setShowSerieForm(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Subseries */}
          <TabsContent value="subseries">
            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Subseries Documentales
                  </CardTitle>
                </div>
                <Dialog open={showSubserieForm} onOpenChange={setShowSubserieForm}>
                  <DialogTrigger asChild>
                    <Button className="hover-lift">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Subserie
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? 'Editar Subserie Documental' : 'Nueva Subserie Documental'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubserieSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="codigo">Código</Label>
                          <Input
                            id="codigo"
                            value={subserieForm.codigo}
                            onChange={(e) => setSubserieForm(prev => ({ ...prev, codigo: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tiempo_retencion">Tiempo Retención (años)</Label>
                          <Input
                            id="tiempo_retencion"
                            type="number"
                            value={subserieForm.tiempo_retencion_anos}
                            onChange={(e) => setSubserieForm(prev => ({ ...prev, tiempo_retencion_anos: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="serie_id">Serie Documental</Label>
                        <Select 
                          value={subserieForm.serie_id} 
                          onValueChange={(value) => setSubserieForm(prev => ({ ...prev, serie_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar serie" />
                          </SelectTrigger>
                          <SelectContent>
                            {series.map((serie: any) => (
                              <SelectItem key={serie.id} value={serie.id}>
                                {serie.codigo} - {serie.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={subserieForm.nombre}
                          onChange={(e) => setSubserieForm(prev => ({ ...prev, nombre: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          value={subserieForm.descripcion}
                          onChange={(e) => setSubserieForm(prev => ({ ...prev, descripcion: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={loading}>
                          {loading ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowSubserieForm(false);
                            setEditingItem(null);
                            setSubserieForm({ codigo: "", nombre: "", descripcion: "", serie_id: "", tiempo_retencion_anos: "" });
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Serie</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Retención (años)</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subseries.map((subserie: any) => (
                      <TableRow key={subserie.id}>
                        <TableCell className="font-medium">{subserie.codigo}</TableCell>
                        <TableCell>{subserie.nombre}</TableCell>
                        <TableCell>{subserie.series_documentales?.nombre}</TableCell>
                        <TableCell className="max-w-xs truncate">{subserie.descripcion}</TableCell>
                        <TableCell>{subserie.tiempo_retencion_anos || 'N/A'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingItem(subserie);
                                  setSubserieForm({
                                    codigo: subserie.codigo,
                                    nombre: subserie.nombre,
                                    descripcion: subserie.descripcion || "",
                                    serie_id: subserie.serie_id,
                                    tiempo_retencion_anos: subserie.tiempo_retencion_anos?.toString() || ""
                                  });
                                  setShowSubserieForm(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground border-t border-border mt-8">
          Creador: Joan Torres © 2025
        </div>
      </div>
    </Layout>
  );
}