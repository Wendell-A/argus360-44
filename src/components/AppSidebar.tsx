import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Calendar,
  ChevronUp,
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
  const [isManagementOpen, setIsManagementOpen] = useState(false);

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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-menu"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-64 flex flex-col gap-4">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navegue pelas funcionalidades do sistema.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              className="justify-start"
              onClick={() => navigate(item.url)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </Button>
          ))}
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="management">
            <AccordionTrigger
              onClick={() => setIsManagementOpen(!isManagementOpen)}
            >
              Gerenciamento
              <ChevronUp className="h-4 w-4" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                {managementItems.map((item) => (
                  <Button
                    key={item.title}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => navigate(item.url)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url as string} />
                  <AvatarFallback>
                    {user?.user_metadata?.full_name
                      ?.split(" ")
                      .map((n: string) => n?.[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {user?.user_metadata?.full_name}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {activeTenant?.tenant_name}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetContent>
    </Sheet>
  );
}
