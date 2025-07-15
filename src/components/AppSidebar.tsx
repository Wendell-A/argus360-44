
import {
  BarChart3,
  Building,
  DollarSign,
  FileText,
  Package,
  Settings,
  ShoppingCart,
  User,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useOffices } from "@/hooks/useOffices";

interface NavItem {
  title: string;
  url: string;
  icon: any;
}

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Vendas",
    url: "/vendas",
    icon: ShoppingCart,
  },
  {
    title: "Vendedores",
    url: "/vendedores",
    icon: Users,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: User,
  },
  {
    title: "Consórcios",
    url: "/consorcios",
    icon: Package,
  },
  {
    title: "Escritórios",
    url: "/escritorios",
    icon: Building,
  },
  {
    title: "Comissões",
    url: "/comissoes",
    icon: DollarSign,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: FileText,
  },
  {
    title: "Auditoria",
    url: "/auditoria",
    icon: Shield,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut, user, activeTenant } = useAuth();
  const { offices } = useOffices();
  const [userOffice, setUserOffice] = useState<any>(null);

  // Buscar o escritório do usuário
  useEffect(() => {
    if (offices && offices.length > 0) {
      // Por enquanto, pega o primeiro escritório (depois pode ser refinado)
      setUserOffice(offices[0]);
    }
  }, [offices]);

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Obter nome do usuário do perfil ou email
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "Usuário";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="space-y-3">
          {/* Nome do Tenant */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-primary">
              {activeTenant?.tenant_name || "Argus360"}
            </h2>
          </div>
          
          {/* Nome do Escritório */}
          {userOffice && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {userOffice.name}
              </p>
            </div>
          )}
          
          {/* Avatar e Nome do Usuário */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(getUserDisplayName())}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-sm font-medium">
                {getUserDisplayName()}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item: NavItem) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => handleNavigation(item.url)}
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

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <SidebarSeparator />
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
