import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      // Fetch documentos data
      const { data: documentos } = await supabase
        .from('documentos')
        .select('id, estado, soporte, dependencia_id, dependencias(nombre)');

      // Fetch prestamos data
      const { data: prestamos } = await supabase
        .from('prestamos')
        .select('id, estado, created_at');

      // Fetch usuarios data
      const { data: usuarios } = await supabase
        .from('profiles')
        .select('id, activo, rol, dependencia_id, dependencias(nombre)');

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