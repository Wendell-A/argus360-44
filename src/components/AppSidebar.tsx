
import { 
  Home, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  UserCheck, 
  Building, 
  Building2, 
  BarChart3, 
  FileText, 
  Settings,
  Briefcase,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Vendas",
    url: "/vendas",
    icon: ShoppingCart,
  },
  {
    title: "Comissões",
    url: "/comissoes",
    icon: DollarSign,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
  },
  {
    title: "Vendedores",
    url: "/vendedores",
    icon: UserCheck,
  },
  {
    title: "Consórcios",
    url: "/consorcios",
    icon: Building,
  },
  {
    title: "Escritórios",
    url: "/escritorios",
    icon: Building2,
  },
  {
    title: "Equipes",
    url: "/equipes",
    icon: Users,
  },
  {
    title: "Departamentos",
    url: "/departamentos",
    icon: Briefcase,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Auditoria",
    url: "/auditoria",
    icon: FileText,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { user, activeTenant, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email || 'Usuário';
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="space-y-2">
          {/* Nome do Tenant */}
          <div className="text-lg font-semibold text-foreground">
            {activeTenant?.tenant_name || 'Sistema'}
          </div>
          
          {/* Avatar e informações do usuário */}
          <div className="flex items-center gap-3 pt-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getUserInitials(getUserDisplayName())}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {getUserDisplayName()}
              </div>
            </div>
          </div>
          
          {/* Botão de Logout */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full mt-2"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.url)}
                    isActive={location.pathname === item.url}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
