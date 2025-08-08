import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  BookOpen, 
  Trash2, 
  Search, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar sesión local
    const checkLocalSession = () => {
      const sessionData = localStorage.getItem('user_session');
      if (sessionData) {
        try {
          const { user, timestamp } = JSON.parse(sessionData);
          // Verificar que la sesión no sea muy antigua (24 horas)
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000 && user) {
            setUser(user);
            setUserProfile(user);
            setSession({ user, timestamp });
          } else {
            localStorage.removeItem('user_session');
            navigate('/auth');
          }
        } catch (error) {
          localStorage.removeItem('user_session');
          navigate('/auth');
        }
      } else {
        navigate('/auth');
      }
    };

    checkLocalSession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user_session');
      setUser(null);
      setUserProfile(null);
      setSession(null);
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive"
      });
    }
  };

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Documentos", path: "/documentos" },
    { icon: BookOpen, label: "Préstamos", path: "/prestamos" },
    { icon: Trash2, label: "Eliminaciones", path: "/eliminaciones" },
    { icon: Search, label: "Consultas", path: "/consultas" },
    { icon: Users, label: "Usuarios", path: "/usuarios", adminOnly: true },
    { icon: BarChart3, label: "Reportes", path: "/reportes" },
    { icon: Settings, label: "Configuración", path: "/configuracion", adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || userProfile?.rol === 'Administrador'
  );

  if (!user || !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/5a91f547-910d-4074-9213-cce908063776.png" 
              alt="UIPCA Logo" 
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-primary">Sistema de Archivo</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {userProfile?.nombre_completo} ({userProfile?.rol})
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-all duration-300 ease-in-out
          fixed lg:static inset-y-0 left-0 z-50
          w-64 glass-effect border-r border-border
        `}>
          <nav className="p-4 space-y-2 mt-4">
            {filteredMenuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-xs text-muted-foreground text-center border-t border-border pt-4">
              Creador: Joan Torres © 2025
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}