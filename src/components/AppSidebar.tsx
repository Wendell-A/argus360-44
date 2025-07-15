
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
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ModeToggle";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  className?: string;
}

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
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu"
          className={cn(
            "mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden",
            className
          )}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full border-r md:w-4/5 lg:max-w-[280px]">
        <SheetHeader className="text-left">
          <SheetTitle>Argus 360</SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex flex-col gap-2">
          {items.map((item: NavItem) => (
            <Button
              key={item.title}
              variant="ghost"
              className={cn(
                "justify-start px-4",
                pathname === item.url
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => handleNavigation(item.url)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </Button>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            className="justify-start px-4"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-center">
          <ModeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
