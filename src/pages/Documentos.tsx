import Layout from "@/components/Layout";

export default function Documentos() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Documentos</h2>
          <p className="text-muted-foreground">Gestión del inventario documental</p>
        </div>
        
        <div className="bg-card p-8 rounded-lg border border-border text-center">
          <h3 className="text-xl font-semibold mb-4">Módulo en Desarrollo</h3>
          <p className="text-muted-foreground">
            Esta funcionalidad está siendo implementada. Pronto podrás gestionar todo tu inventario documental.
          </p>
        </div>
      </div>
    </Layout>
  );
}