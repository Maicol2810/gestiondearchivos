import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { X, Filter } from "lucide-react";

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export default function AdvancedFilters({ onFiltersChange, onClose }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState({
    dependencia: "",
    serie: "",
    subserie: "",
    estado: "",
    soporte: "",
    fechaDesde: "",
    fechaHasta: "",
    ubicacionFisica: ""
  });

  const [dependencias, setDependencias] = useState([]);
  const [series, setSeries] = useState([]);
  const [subseries, setSubseries] = useState([]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (filters.serie) {
      fetchSubseries(filters.serie);
    } else {
      setSubseries([]);
      setFilters(prev => ({ ...prev, subserie: "" }));
    }
  }, [filters.serie]);

  const fetchDropdownData = async () => {
    try {
      const [depRes, seriesRes] = await Promise.all([
        supabase.from('dependencias').select('*').order('nombre'),
        supabase.from('series_documentales').select('*').order('nombre')
      ]);

      if (depRes.data) setDependencias(depRes.data);
      if (seriesRes.data) setSeries(seriesRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchSubseries = async (serieId: string) => {
    try {
      const { data } = await supabase
        .from('subseries_documentales')
        .select('*')
        .eq('serie_id', serieId)
        .order('nombre');
      
      if (data) setSubseries(data);
    } catch (error) {
      console.error('Error fetching subseries:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      dependencia: "",
      serie: "",
      subserie: "",
      estado: "",
      soporte: "",
      fechaDesde: "",
      fechaHasta: "",
      ubicacionFisica: ""
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  return (
    <Card className="w-full glass-effect">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avanzados
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Dependencia</Label>
            <Select value={filters.dependencia} onValueChange={(value) => handleFilterChange('dependencia', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar dependencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las dependencias</SelectItem>
                {dependencias.map((dep: any) => (
                  <SelectItem key={dep.id} value={dep.id}>{dep.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Serie Documental</Label>
            <Select value={filters.serie} onValueChange={(value) => handleFilterChange('serie', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar serie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las series</SelectItem>
                {series.map((serie: any) => (
                  <SelectItem key={serie.id} value={serie.id}>{serie.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subserie</Label>
            <Select 
              value={filters.subserie} 
              onValueChange={(value) => handleFilterChange('subserie', value)}
              disabled={!filters.serie}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar subserie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las subseries</SelectItem>
                {subseries.map((subserie: any) => (
                  <SelectItem key={subserie.id} value={subserie.id}>{subserie.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={filters.estado} onValueChange={(value) => handleFilterChange('estado', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Transferido">Transferido</SelectItem>
                <SelectItem value="Eliminado">Eliminado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Soporte</Label>
            <Select value={filters.soporte} onValueChange={(value) => handleFilterChange('soporte', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar soporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los soportes</SelectItem>
                <SelectItem value="Papel">Papel</SelectItem>
                <SelectItem value="Digital">Digital</SelectItem>
                <SelectItem value="Microfilm">Microfilm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ubicación Física</Label>
            <Input
              placeholder="Filtrar por ubicación"
              value={filters.ubicacionFisica}
              onChange={(e) => handleFilterChange('ubicacionFisica', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha Desde</Label>
            <Input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha Hasta</Label>
            <Input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={clearFilters} variant="outline">
            Limpiar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}