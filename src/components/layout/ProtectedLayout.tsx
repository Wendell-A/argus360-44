
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { ModeToggle } from "@/components/ModeToggle";

export function ProtectedLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <SidebarInset className="flex-1 bg-white">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-white">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-lg font-semibold text-gray-900">Argus360</h1>
            </div>
            <ModeToggle />
          </header>
          <main className="flex-1 p-6 bg-gray-50">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
