
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Calendar,
  ChevronRight,
  Home,
  Users,
  ShoppingCart,
  UserCheck,
  DollarSign,
  Target,
  Calculator,
  BarChart3,
  Building2,
  Users2,
  Briefcase,
  Shield,
  Settings,
  History
} from "lucide-react";

export function AppSidebar() {
  const { user, activeTenant, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      title: "Comissões",
      url: "/comissoes",
      icon: DollarSign,
    },
    {
      title: "Consórcios",
      url: "/consorcios",
      icon: Target,
    },
    {
      title: "Simulação",
      url: "/simulacao-consorcio",
      icon: Calculator,
    },
    {
      title: "Relatórios",
      url: "/relatorios",
      icon: BarChart3,
    },
  ];

  const managementItems = [
    {
      title: "Escritórios",
      url: "/escritorios",
      icon: Building2,
    },
    {
      title: "Equipes",
      url: "/equipes", 
      icon: Users2,
    },
    {
      title: "Departamentos",
      url: "/departamentos",
      icon: Briefcase,
    },
    {
      title: "Permissões",
      url: "/permissoes",
      icon: Shield,
    },
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: Settings,
    },
    {
      title: "Auditoria",
      url: "/auditoria",
      icon: History,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Argus360</span>
            <span className="truncate text-xs text-muted-foreground">
              {activeTenant?.tenant_name}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="w-full justify-start"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between text-left [&[data-state=open]>svg]:rotate-90">
                Gerenciamento
                <ChevronRight className="ml-auto transition-transform duration-200" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive(item.url)}
                      >
                        <button
                          onClick={() => navigate(item.url)}
                          className="w-full justify-start"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage 
                      src={user?.user_metadata?.avatar_url as string} 
                      alt={user?.user_metadata?.full_name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.user_metadata?.full_name
                        ?.split(" ")
                        .map((n: string) => n?.[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.user_metadata?.full_name}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage 
                        src={user?.user_metadata?.avatar_url as string} 
                        alt={user?.user_metadata?.full_name}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user?.user_metadata?.full_name
                          ?.split(" ")
                          .map((n: string) => n?.[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.user_metadata?.full_name}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
