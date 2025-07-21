
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  UsersIcon,
  Building,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Vendedores", url: "/vendedores", icon: UserCheck },
  { title: "Comissões", url: "/comissoes", icon: DollarSign },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "Consórcios", url: "/consorcios", icon: Building2 },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const managementItems = [
  { title: "Escritórios", url: "/escritorios", icon: Building },
  { title: "Equipes", url: "/equipes", icon: UsersIcon },
  { title: "Departamentos", url: "/departamentos", icon: Building2 },
];

const configItems = [
  { title: "Permissões", url: "/permissoes", icon: Shield },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Auditoria", url: "/auditoria", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTenant, signOut } = useAuth();
  const { currentUser, isLoading } = useCurrentUser();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const getRoleDisplayName = (role?: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      seller: 'Vendedor',
      user: 'Usuário'
    };
    return roleMap[role || 'user'] || 'Usuário';
  };

  const handleLogout = async () => {
    try {
      // Fazer logout através do contexto de autenticação
      await signOut();
      
      // Limpar qualquer cache local adicional se necessário
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Redirecionar para a página de login
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, redirecionar para garantir segurança
      navigate('/auth/login', { replace: true });
    }
  };

  return (
    <Sidebar className={cn("transition-all duration-200", collapsed ? "w-14" : "w-64")} variant="sidebar">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-sidebar-foreground truncate">
                  {activeTenant?.tenant_name || 'Argus360'}
                </h2>
                <p className="text-xs text-sidebar-foreground/70">Sistema de Vendas</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-sidebar-border">
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              {!collapsed && (
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <UserAvatar 
                avatarUrl={currentUser?.avatar_url}
                fullName={currentUser?.full_name || 'Usuário'}
                size="md"
              />
              {!collapsed && currentUser && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-sidebar-foreground truncate">
                    {currentUser.full_name}
                  </div>
                  <div className="text-xs text-sidebar-foreground/70 truncate">
                    {getRoleDisplayName(currentUser.role)}
                  </div>
                  {currentUser.department && (
                    <div className="text-xs text-sidebar-foreground/60 truncate">
                      {currentUser.department.name}
                    </div>
                  )}
                  {currentUser.office && (
                    <div className="text-xs text-sidebar-foreground/60 truncate">
                      {currentUser.office.name}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                        isActive(item.url)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                        isActive(item.url)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                        isActive(item.url)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-sidebar-border space-y-2">
          {/* Botão de Logout */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && "Sair"}
          </Button>
          
          <SidebarTrigger className="w-full" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
