
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserMenuConfig } from '@/hooks/useUserMenuConfig';
import { useGreeting } from '@/hooks/useGreeting';
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
  User,
  MapPin
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

// Interface para itens do menu
interface MenuItem {
  name: string;
  path: string;
  icon: any;
  enabled: boolean;
  subItems?: Array<{ name: string; path: string }>;
}

interface MenuSection {
  group: string;
  items: MenuItem[];
}

export default function AppSidebar() {
  const { signOut } = useAuth();
  const { profileData, organizationData, isLoading: profileLoading } = useProfile();
  const { data: menuConfig, isLoading: configLoading } = useUserMenuConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  
  const firstName = profileData?.full_name?.split(' ')[0] || 'usuário';
  const greeting = useGreeting(firstName);
  
  // Mapear role para nome legível
  const getRoleName = (role?: string) => {
    const roleMap: Record<string, string> = {
      'owner': 'Proprietário',
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuário',
      'viewer': 'Visualizador'
    };
    return role ? roleMap[role] || role : 'Usuário';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems: MenuSection[] = [
    {
      group: 'Principal',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: Home, enabled: true },
        { name: 'CRM', path: '/crm', icon: Users, enabled: true },
        { name: 'Clientes', path: '/clientes', icon: UserCheck, enabled: true },
        { name: 'Vendas', path: '/vendas', icon: ShoppingCart, enabled: true },
        { name: 'Inadimplentes', path: '/inadimplentes', icon: FileWarning, enabled: true },
        { name: 'Vendedores', path: '/vendedores', icon: Users, enabled: menuConfig?.modules?.sellers || false },
        { 
          name: 'Comissões', 
          path: '/comissoes', 
          icon: DollarSign, 
          enabled: menuConfig?.modules?.commissions || false,
          subItems: [
            { name: 'Escritório', path: '/comissoes/escritorio' },
            { name: 'Vendedores', path: '/comissoes/vendedores' }
          ]
        },
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

  if (profileLoading || configLoading) {
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
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Header com informações do usuário - Modernizado e Centralizado */}
        <div className="p-4 border-b">
          {state !== 'collapsed' ? (
            // Estado Expandido - Layout Centralizado
            <div className="flex flex-col items-center space-y-3 transition-all duration-500 ease-in-out">
              <UserAvatar
                avatarUrl={profileData?.avatar_url}
                fullName={profileData?.full_name || 'Usuário'}
                size="xl"
              />
              
              <div className="text-center space-y-1 w-full">
                <h3 className="text-base font-semibold text-foreground leading-tight">
                  {greeting.fullGreeting}
                </h3>
                <p className="text-sm text-muted-foreground leading-tight">
                  {greeting.message}
                </p>
              </div>

              <div className="h-px bg-border/50 w-3/4" />
              
              <div className="space-y-2 text-xs text-center w-full">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-medium text-foreground">{organizationData?.tenant_name || 'Sem empresa'}</span>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-foreground">{organizationData?.office_name || 'Sem escritório'}</span>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-primary font-medium">{getRoleName(organizationData?.role)}</span>
                </div>
              </div>

              <div className="h-px bg-border/50 w-3/4" />
              
              <NotificationBell />
            </div>
          ) : (
            // Estado Colapsado - Apenas Avatar
            <div className="flex flex-col items-center space-y-2 transition-all duration-500 ease-in-out">
              <UserAvatar
                avatarUrl={profileData?.avatar_url}
                fullName={profileData?.full_name || 'Usuário'}
                size="lg"
              />
            </div>
          )}
        </div>

        {/* Menu de navegação */}
        <div className="flex-1">
          {state !== 'collapsed' && (
            <div className="h-px bg-border/50 mx-4 my-2" />
          )}
          
          {menuItems.map((section) => (
            <SidebarGroup key={section.group}>
              {state !== 'collapsed' && <SidebarGroupLabel>{section.group}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarNav>
                  {section.items
                    .filter(item => item.enabled)
                    .map((item) => {
                      // Se o item tem subitens (submenu)
                      if ('subItems' in item && item.subItems && item.subItems.length > 0) {
                        return (
                          <SidebarItem key={item.name}>
                            <div className="space-y-1">
                              {/* Título do grupo (não clicável) */}
                              {state !== 'collapsed' && (
                                <div className="flex items-center px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                  <item.icon className="w-4 h-4 mr-2" />
                                  <span>{item.name}</span>
                                </div>
                              )}
                              
                              {/* Subitens */}
                              <div className={state !== 'collapsed' ? 'ml-6 space-y-1' : 'space-y-1'}>
                                {item.subItems.map((subItem: any) => (
                                  <SidebarMenuButton
                                    key={subItem.name}
                                    asChild
                                    isActive={location.pathname === subItem.path}
                                    title={state === 'collapsed' ? subItem.name : undefined}
                                  >
                                    <Link to={subItem.path}>
                                      <item.icon className="w-4 h-4" />
                                      {state !== 'collapsed' && <span>{subItem.name}</span>}
                                    </Link>
                                  </SidebarMenuButton>
                                ))}
                              </div>
                            </div>
                          </SidebarItem>
                        );
                      }
                      
                      // Item normal sem submenu
                      return (
                        <SidebarItem key={item.name}>
                          <SidebarMenuButton
                            asChild
                            isActive={location.pathname === item.path}
                            title={state === 'collapsed' ? item.name : undefined}
                          >
                            <Link to={item.path}>
                              <item.icon className="w-4 h-4" />
                              {state !== 'collapsed' && <span>{item.name}</span>}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarItem>
                      );
                    })}
                </SidebarNav>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        {/* Footer com logout */}
        <div className="p-4 border-t">
          {state !== 'collapsed' && (
            <div className="h-px bg-border/50 mb-2" />
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start"
            title={state === 'collapsed' ? 'Sair' : undefined}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {state !== 'collapsed' && <span>Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
