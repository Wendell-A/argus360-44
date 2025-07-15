
import { Home, Users, Building, UsersRound, Car, DollarSign, BarChart3, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Vendedores",
    url: "/vendedores",
    icon: Users,
  },
  {
    title: "Escritórios",
    url: "/escritorios",
    icon: Building,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: UsersRound,
  },
  {
    title: "Consórcios",
    url: "/consorcios",
    icon: Car,
  },
  {
    title: "Comissões",
    url: "/comissoes",
    icon: DollarSign,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { signOut, user, activeTenant } = useAuth();
  const { collapsed } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2">
          {!collapsed ? (
            <div>
              <h2 className="text-lg font-bold text-primary">ConsórcioPro</h2>
              {activeTenant && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {activeTenant.tenant_name}
                </p>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">CP</span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-accent text-accent-foreground font-medium" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-2">
          {!collapsed ? (
            <>
              <div className="mb-2 text-sm text-muted-foreground truncate">
                {user?.email}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="w-full aspect-square p-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
