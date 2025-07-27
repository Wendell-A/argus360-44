
import React from "react";
import {
  Calendar,
  ChevronUp,
  Home,
  Inbox,
  Search,
  Settings,
  User2,
  Building,
  Building2,
  Briefcase,
  Users,
  UserCog,
  Target,
  DollarSign,
  TrendingUp,
  Mail,
  Shield,
  FileText,
  BarChart3,
  Calculator,
  Banknote,
  Car,
  LogOut,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserMenuConfig } from "@/hooks/useUserMenuConfig";

// Component for individual sidebar items
const SidebarItem = ({ title, url, icon: Icon }: { title: string; url: string; icon: any }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === url;
  
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start"
      onClick={() => navigate(url)}
    >
      <Icon className="mr-2 h-4 w-4" />
      {title}
    </Button>
  );
};

// Component for sidebar navigation group
const SidebarNav = ({ children }: { children: React.ReactNode }) => {
  return <div className="space-y-1 px-2">{children}</div>;
};

const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { user, signOut, activeTenant } = useAuth();
  const navigate = useNavigate();
  const { data: menuConfig, isLoading: menuLoading } = useUserMenuConfig();

  const navigationItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "CRM",
      url: "/crm",
      icon: Inbox,
    },
  ];

  const crmItems = [
    {
      title: "Clientes",
      url: "/clientes",
      icon: User2,
    },
    {
      title: "Vendas",
      url: "/vendas",
      icon: TrendingUp,
    },
    {
      title: "Vendedores",
      url: "/vendedores",
      icon: User2,
    },
    {
      title: "Comissões",
      url: "/comissoes",
      icon: DollarSign,
    },
    {
      title: "Consórcios",
      url: "/consorcios",
      icon: Car,
    },
    {
      title: "Simulação",
      url: "/simulacao-consorcio",
      icon: Calculator,
    },
    {
      title: "Metas",
      url: "/metas",
      icon: Target,
    },
    {
      title: "Relatórios",
      url: "/relatorios",
      icon: BarChart3,
    },
  ];

  const configItems = [
    {
      title: "Escritórios",
      url: "/escritorios",
      icon: Building,
    },
    {
      title: "Departamentos", 
      url: "/departamentos",
      icon: Building2,
    },
    {
      title: "Cargos",
      url: "/cargos",
      icon: Briefcase,
    },
    {
      title: "Equipes",
      url: "/equipes",
      icon: Users,
    },
    {
      title: "Usuários",
      url: "/usuarios", 
      icon: UserCog,
    },
    {
      title: "Convites",
      url: "/convites",
      icon: Mail,
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
      icon: FileText,
    },
  ];

  return (
    <Sidebar className="w-64">
      <SidebarHeader>
        <Button variant="ghost" asChild className="h-auto p-0" onClick={() => navigate("/dashboard")}>
          <div className="flex items-center gap-2">
            <Banknote className="h-6 w-6" />
            <span className="font-bold text-xl">Argus 360</span>
          </div>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea>
          <SidebarNav>
            {navigationItems.map((item) => (
              <SidebarItem key={item.title} title={item.title} url={item.url} icon={item.icon} />
            ))}
          </SidebarNav>
          <Separator className="my-2" />
          <Accordion type="single" collapsible className="pb-2">
            <AccordionItem value="crm">
              <AccordionTrigger className="hover:text-primary">
                CRM <ChevronUp className="h-4 w-4" />
              </AccordionTrigger>
              <AccordionContent>
                <SidebarNav>
                  {crmItems.map((item) => (
                    <SidebarItem key={item.title} title={item.title} url={item.url} icon={item.icon} />
                  ))}
                </SidebarNav>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator className="my-2" />
          <Accordion type="single" collapsible className="pb-2">
            <AccordionItem value="config">
              <AccordionTrigger className="hover:text-primary">
                Sistema <ChevronUp className="h-4 w-4" />
              </AccordionTrigger>
              <AccordionContent>
                <SidebarNav>
                  {configItems.map((item) => (
                    <SidebarItem key={item.title} title={item.title} url={item.url} icon={item.icon} />
                  ))}
                </SidebarNav>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-8 w-full p-0 px-2 justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url as string} alt={user?.user_metadata?.full_name as string} />
                  <AvatarFallback>{user?.user_metadata?.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span>{user?.user_metadata?.full_name}</span>
                  <span className="text-muted-foreground text-sm">{activeTenant?.tenant_name}</span>
                </div>
              </div>
              <LogOut className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
