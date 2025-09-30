
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserMenuConfig } from '@/hooks/useUserMenuConfig';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Users,
  ShoppingCart,
  UserCheck,
  DollarSign,
  BarChart3,
  Building2,
  Settings,
  Shield,
  FileText,
  Target,
  Building,
  LogOut,
  Calculator,
  Briefcase,
  Car,
  MessageSquare,
  FileSpreadsheet,
  Play,
  FileWarning,
  User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Componentes internos para resolver problemas de importação
const SidebarItem = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
  <SidebarMenuItem {...props}>{children}</SidebarMenuItem>
);

const SidebarNav = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
  <SidebarMenu {...props}>{children}</SidebarMenu>
);

export default function AppSidebar() {
  const { signOut, activeTenant, user } = useAuth();
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: menuConfig, isLoading: configLoading } = useUserMenuConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    {
      group: 'Principal',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: Home, enabled: true },
        { name: 'CRM', path: '/crm', icon: Users, enabled: true },
        { name: 'Clientes', path: '/clientes', icon: UserCheck, enabled: true },
        { name: 'Vendas', path: '/vendas', icon: ShoppingCart, enabled: true },
        { name: 'Inadimplentes', path: '/inadimplentes', icon: FileWarning, enabled: true },
        { name: 'Vendedores', path: '/vendedores', icon: Users, enabled: menuConfig?.modules?.sellers || false },
        { name: 'Comissões', path: '/comissoes', icon: DollarSign, enabled: menuConfig?.modules?.commissions || false },
        { name: 'Consórcios', path: '/consorcios', icon: Car, enabled: true },
        { name: 'Orçamentos', path: '/proposals', icon: FileSpreadsheet, enabled: true },
        { name: 'Metas', path: '/metas', icon: Target, enabled: true },
        { name: 'Simulação Consórcio', path: '/simulacao-consorcio', icon: Calculator, enabled: true },
        { name: 'Treinamentos', path: '/training', icon: Play, enabled: true },
        { name: 'Suporte', path: '/suporte', icon: MessageSquare, enabled: true },
      ]
    },
    {
      group: 'Gestão',
      items: [
        { name: 'Relatórios', path: '/relatorios', icon: BarChart3, enabled: menuConfig?.modules?.reports || false },
        { name: 'Escritórios', path: '/escritorios', icon: Building, enabled: menuConfig?.modules?.offices || false },
        { name: 'Departamentos', path: '/departamentos', icon: Building2, enabled: menuConfig?.modules?.departments || false },
        { name: 'Cargos', path: '/cargos', icon: Briefcase, enabled: menuConfig?.modules?.positions || false },
        { name: 'Equipes', path: '/equipes', icon: Users, enabled: menuConfig?.modules?.teams || false },
      ]
    },
    {
      group: 'Sistema',
      items: [
        { name: 'Perfil', path: '/perfil', icon: User, enabled: true },
        { name: 'Usuários', path: '/usuarios', icon: Users, enabled: menuConfig?.modules?.users || false },
        { name: 'Convites', path: '/convites', icon: FileText, enabled: menuConfig?.modules?.invitations || false },
        { name: 'Permissões', path: '/permissoes', icon: Shield, enabled: menuConfig?.modules?.permissions || false },
        { name: 'Configurações', path: '/configuracoes', icon: Settings, enabled: menuConfig?.modules?.configurations || false },
      ]
    }
  ];

  if (userLoading || configLoading) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="p-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header com informações do usuário */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <UserAvatar 
              avatarUrl={currentUser?.avatar_url}
              fullName={currentUser?.full_name || user?.email || 'Usuário'}
              size="md" 
            />
            {state !== 'collapsed' && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {currentUser?.full_name || user?.email || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activeTenant?.tenant_name || 'Empresa'}
                </p>
                {currentUser?.office && (
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser.office.name}
                  </p>
                )}
              </div>
            )}
            <NotificationBell />
          </div>
        </div>

        {/* Menu de navegação */}
        <div className="flex-1">
          {menuItems.map((section) => (
            <SidebarGroup key={section.group}>
              <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarNav>
                  {section.items
                    .filter(item => item.enabled)
                    .map((item) => (
                      <SidebarItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === item.path}
                        >
                          <Link to={item.path}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarItem>
                    ))}
                </SidebarNav>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        {/* Footer com logout */}
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {state !== 'collapsed' && <span>Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
