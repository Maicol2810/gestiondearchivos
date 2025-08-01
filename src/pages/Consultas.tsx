import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import ConsultaForm from "@/components/ConsultaForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Consultas() {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchConsultas();
  }, []);

  const fetchConsultas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consultas')
        .select(`
          *,
          profiles(nombre_completo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultas(data || []);
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

  const getEstadoBadge = (estado: string) => {
    const variants = { Pendiente: "outline", Respondida: "default", Cerrada: "secondary" };
    return <Badge variant={variants[estado as keyof typeof variants] as any}>{estado}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Consultas</h2>
            <p className="text-muted-foreground">Sistema de consultas y soporte</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="hover-lift animate-pulse-glow">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva Consulta</DialogTitle>
              </DialogHeader>
              <ConsultaForm 
                onSuccess={() => {
                  setShowForm(false);
                  fetchConsultas();
                }} 
                onCancel={() => setShowForm(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar consultas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Lista de Consultas</CardTitle>
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultas.map((consulta: any) => (
                    <TableRow key={consulta.id}>
                      <TableCell>{consulta.tipo_consulta}</TableCell>
                      <TableCell>{consulta.asunto}</TableCell>
                      <TableCell>{consulta.profiles?.nombre_completo}</TableCell>
                      <TableCell>{getEstadoBadge(consulta.estado)}</TableCell>
                      <TableCell>{new Date(consulta.created_at).toLocaleDateString()}</TableCell>
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