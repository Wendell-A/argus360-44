
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

// Pages
import Index from "@/pages/Index";
import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import Vendas from "@/pages/Vendas";
import Clientes from "@/pages/Clientes";
import Vendedores from "@/pages/Vendedores";
import Comissoes from "@/pages/Comissoes";
import Metas from "@/pages/Metas";
import Consorcios from "@/pages/Consorcios";
import SimulacaoConsorcio from "@/pages/SimulacaoConsorcio";
import Relatorios from "@/pages/Relatorios";
import Escritorios from "@/pages/Escritorios";
import Equipes from "@/pages/Equipes";
import Departamentos from "@/pages/Departamentos";
import Permissoes from "@/pages/Permissoes";
import Configuracoes from "@/pages/Configuracoes";
import Auditoria from "@/pages/Auditoria";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              
              {/* Protected routes with layout */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Dashboard />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/vendas" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Vendas />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/clientes" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Clientes />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/vendedores" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Vendedores />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/comissoes" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Comissoes />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/metas" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Metas />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/consorcios" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Consorcios />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/simulacao-consorcio" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <SimulacaoConsorcio />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Relatorios />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/escritorios" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Escritorios />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/equipes" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Equipes />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/departamentos" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Departamentos />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/permissoes" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Permissoes />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Configuracoes />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
              
              <Route path="/auditoria" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <ProtectedLayout>
                      <Auditoria />
                    </ProtectedLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
