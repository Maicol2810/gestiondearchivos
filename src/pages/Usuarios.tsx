import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import UsuarioForm from "@/components/UsuarioForm";
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
  UserCheck,
  UserX,
  Users,
  Shield,
  User,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setUserRole(user?.rol || "");
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Solo los administradores pueden ver todos los usuarios
      if (user.rol !== 'Administrador') {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para ver esta sección",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          dependencias(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
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

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const user = getCurrentUser();
      if (!user || user.rol !== 'Administrador') {
        throw new Error("No tienes permisos para realizar esta acción");
      }

      const { error } = await supabase
        .from('profiles')
        .update({ activo: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`
      });
      
      fetchUsuarios();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredUsuarios = usuarios.filter((usuario: any) =>
    usuario.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (rol: string) => {
    const variants = {
      'Administrador': 'default',
      'Usuario': 'secondary',
      'Consultor': 'outline'
    };
    return <Badge variant={variants[rol as keyof typeof variants] as any}>{rol}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h2>
            <p className="text-muted-foreground">Administrar usuarios del sistema</p>
          </div>
          {userRole === 'Administrador' && (
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button className="hover-lift animate-pulse-glow">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </DialogTitle>
                </DialogHeader>
                <UsuarioForm 
                  usuario={editingUser}
                  onSuccess={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    fetchUsuarios();
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingUser(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground border-t border-border mt-8">
          Creador: Joan Torres © 2025
        </div>

        {/* Search */}
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover-lift glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                  <p className="text-2xl font-bold">{usuarios.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover-lift glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold">
                    {usuarios.filter((u: any) => u.activo).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                  <p className="text-2xl font-bold">
                    {usuarios.filter((u: any) => u.rol === 'Administrador').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
                  <p className="text-2xl font-bold">
                    {usuarios.filter((u: any) => u.rol === 'Usuario').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Dependencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((usuario: any) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.nombre_completo}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{getRoleBadge(usuario.rol)}</TableCell>
                      <TableCell>{usuario.dependencias?.nombre || 'Sin asignar'}</TableCell>
                      <TableCell>
                        <Badge variant={usuario.activo ? "default" : "secondary"}>
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userRole === 'Administrador' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingUser(usuario);
                                  setShowForm(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(usuario.id, !usuario.activo)}
                              >
                                {usuario.activo ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}