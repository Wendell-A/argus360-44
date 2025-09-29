import React from 'react';
import { Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  BarChart3, 
  Building, 
  CreditCard, 
  Settings, 
  LogOut,
  Monitor,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminLayout = () => {
  const { superAdmin, isAuthenticated, signOut } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart3,
    },
    {
      name: 'Tenants',
      href: '/admin/tenants',
      icon: Building,
    },
    {
      name: 'Pagamentos',
      href: '/admin/payments',
      icon: CreditCard,
    },
    {
      name: 'Super Admins',
      href: '/admin/super-admins',
      icon: Shield,
    },
    {
      name: 'Treinamentos',
      href: '/admin/training',
      icon: GraduationCap,
    },
    {
      name: 'Suporte',
      href: '/admin/support',
      icon: MessageSquare,
    },
    {
      name: 'Monitor Sistema',
      href: '/admin/monitor',
      icon: Monitor,
    },
    {
      name: 'Configurações',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-xl font-bold text-red-900">Argus360 Admin</h1>
              <p className="text-sm text-muted-foreground">Portal Administrativo</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {superAdmin?.full_name}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={signOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isCurrent = isCurrentPath(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isCurrent 
                      ? 'bg-red-100 text-red-900 border border-red-200' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isCurrent ? 'text-red-600' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Info do Sistema */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Sistema</p>
              <p className="text-sm font-medium">Argus360 v1.0</p>
              <Link 
                to="/" 
                className="text-xs text-blue-600 hover:text-blue-700 mt-1 block"
              >
                ← Voltar ao site principal
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;