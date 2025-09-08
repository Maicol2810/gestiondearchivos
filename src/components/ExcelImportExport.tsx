import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/integrations/supabase/client";

interface ExcelImportExportProps {
  onImportSuccess: () => void;
  documentos: any[];
}

export default function ExcelImportExport({ onImportSuccess, documentos }: ExcelImportExportProps) {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        nombre: "Ejemplo de Documento",
        codigo_unico: "DOC-001",
        dependencia_codigo: "DG",
        serie_codigo: "AC",
        subserie_codigo: "AC-01",
        fecha_creacion_documento: "2024-01-15",
        ubicacion_fisica: "Archivo Central - Estante A1",
        soporte: "Papel",
        estado: "Activo",
        observaciones: "Documento de ejemplo"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Documentos");
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 30 }, // nombre
      { wch: 15 }, // codigo_unico
      { wch: 15 }, // dependencia_codigo
      { wch: 15 }, // serie_codigo
      { wch: 15 }, // subserie_codigo
      { wch: 20 }, // fecha_creacion_documento
      { wch: 30 }, // ubicacion_fisica
      { wch: 10 }, // soporte
      { wch: 10 }, // estado
      { wch: 30 }  // observaciones
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, "plantilla_documentos.xlsx");
    
    toast({
      title: "Plantilla descargada",
      description: "La plantilla de Excel ha sido descargada correctamente"
    });
  };

  const exportDocuments = () => {
    if (documentos.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay documentos para exportar",
        variant: "destructive"
      });
      return;
    }

    const exportData = documentos.map(doc => ({
      codigo_unico: doc.codigo_unico,
      nombre: doc.nombre,
      dependencia: doc.dependencias?.nombre || '',
      serie: doc.series_documentales?.nombre || '',
      subserie: doc.subseries_documentales?.nombre || '',
      fecha_ingreso: doc.fecha_ingreso,
      fecha_creacion_documento: doc.fecha_creacion_documento || '',
      ubicacion_fisica: doc.ubicacion_fisica || '',
      soporte: doc.soporte,
      estado: doc.estado,
      observaciones: doc.observaciones || '',
      creado_por: doc.created_by_profile?.nombre_completo || '',
      fecha_creacion: new Date(doc.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Documentos");
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // codigo_unico
      { wch: 30 }, // nombre
      { wch: 20 }, // dependencia
      { wch: 20 }, // serie
      { wch: 20 }, // subserie
      { wch: 15 }, // fecha_ingreso
      { wch: 20 }, // fecha_creacion_documento
      { wch: 30 }, // ubicacion_fisica
      { wch: 10 }, // soporte
      { wch: 10 }, // estado
      { wch: 30 }, // observaciones
      { wch: 20 }, // creado_por
      { wch: 15 }  // fecha_creacion
    ];
    ws['!cols'] = colWidths;

    const fileName = `documentos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Exportación exitosa",
      description: `Se exportaron ${documentos.length} documentos`
    });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Leer archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("El archivo Excel está vacío");
      }

      // Obtener datos de referencia
      const [dependenciasRes, seriesRes, subseriesRes] = await Promise.all([
        supabase.from('dependencias').select('id, codigo'),
        supabase.from('series_documentales').select('id, codigo'),
        supabase.from('subseries_documentales').select('id, codigo')
      ]);

      const dependenciasMap = new Map(dependenciasRes.data?.map(d => [d.codigo, d.id]) || []);
      const seriesMap = new Map(seriesRes.data?.map(s => [s.codigo, s.id]) || []);
      const subseriesMap = new Map(subseriesRes.data?.map(s => [s.codigo, s.id]) || []);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Procesar cada fila
      for (const [index, row] of jsonData.entries()) {
        try {
          const rowData = row as any;
          
          // Validar campos requeridos
          if (!rowData.nombre || !rowData.codigo_unico) {
            errors.push(`Fila ${index + 2}: Nombre y código único son requeridos`);
            errorCount++;
            continue;
          }

          // Mapear códigos a IDs
          const dependenciaId = dependenciasMap.get(rowData.dependencia_codigo);
          const serieId = seriesMap.get(rowData.serie_codigo);
          const subserieId = subseriesMap.get(rowData.subserie_codigo);

          if (!dependenciaId || !serieId || !subserieId) {
            errors.push(`Fila ${index + 2}: Códigos de dependencia, serie o subserie no válidos`);
            errorCount++;
            continue;
          }

          // Verificar permisos de dependencia para usuarios no administradores
          if (user.rol !== 'Administrador' && user.dependencia_id !== dependenciaId) {
            errors.push(`Fila ${index + 2}: No tienes permisos para crear documentos en esta dependencia`);
            errorCount++;
            continue;
          }

          const documentData = {
            nombre: rowData.nombre,
            codigo_unico: rowData.codigo_unico,
            dependencia_id: dependenciaId,
            serie_id: serieId,
            subserie_id: subserieId,
            fecha_creacion_documento: rowData.fecha_creacion_documento || null,
            ubicacion_fisica: rowData.ubicacion_fisica || null,
            soporte: rowData.soporte || 'Papel',
            estado: rowData.estado || 'Activo',
            observaciones: rowData.observaciones || null
          };

          // Crear documento usando función RPC
          const { data: result, error } = await supabase.rpc('create_document', {
            document_data: documentData,
            user_id: user.id,
            user_role: user.rol
          });

          if (error) throw error;

          const resultData = result as any;
          if (!resultData.success) {
            errors.push(`Fila ${index + 2}: ${resultData.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`Fila ${index + 2}: ${error.message}`);
          errorCount++;
        }
      }

      // Mostrar resultados
      if (successCount > 0) {
        toast({
          title: "Importación completada",
          description: `${successCount} documentos importados correctamente${errorCount > 0 ? `, ${errorCount} errores` : ''}`
        });
        onImportSuccess();
      }

      if (errors.length > 0) {
        console.error('Import errors:', errors);
        toast({
          title: "Errores en la importación",
          description: `${errorCount} filas con errores. Revisa la consola para más detalles.`,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      toast({
        title: "Error en la importación",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar/Exportar Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="hover-lift"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar Plantilla
          </Button>

          <div>
            <input
              type="file"
              id="excel-import"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
              disabled={importing}
            />
            <Button
              onClick={() => document.getElementById('excel-import')?.click()}
              disabled={importing}
              className="w-full hover-lift"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importando..." : "Importar Excel"}
            </Button>
          </div>

          <Button
            onClick={exportDocuments}
            variant="secondary"
            className="hover-lift"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Documentos
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Instrucciones para importar:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Descarga la plantilla Excel y completa los datos</li>
            <li>Usa los códigos exactos de dependencias, series y subseries</li>
            <li>Los campos nombre y codigo_unico son obligatorios</li>
            <li>Las fechas deben estar en formato YYYY-MM-DD</li>
            <li>Los valores de soporte: Papel, Digital</li>
            <li>Los valores de estado: Activo, Transferido, Eliminado</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}