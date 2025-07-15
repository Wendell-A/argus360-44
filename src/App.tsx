
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import Vendedores from "./pages/Vendedores";
import Clientes from "./pages/Clientes";
import Consorcios from "./pages/Consorcios";
import Escritorios from "./pages/Escritorios";
import Comissoes from "./pages/Comissoes";
import Relatorios from "./pages/Relatorios";
import Auditoria from "./pages/Auditoria";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
              <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Protected Routes with Layout */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Dashboard />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/vendas" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Vendas />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/vendedores" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Vendedores />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/clientes" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Clientes />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/consorcios" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Consorcios />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/escritorios" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Escritorios />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/comissoes" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Comissoes />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Relatorios />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/auditoria" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Auditoria />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Configuracoes />
                  </ProtectedLayout>
                </ProtectedRoute>
              } />

              {/* 404 Route */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
