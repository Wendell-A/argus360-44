
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

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
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes with Layout */}
              <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="vendas" element={<Vendas />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="vendedores" element={<Vendedores />} />
                <Route path="comissoes" element={<Comissoes />} />
                <Route path="metas" element={<Metas />} />
                <Route path="consorcios" element={<Consorcios />} />
                <Route path="simulacao-consorcio" element={<SimulacaoConsorcio />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="escritorios" element={<Escritorios />} />
                <Route path="equipes" element={<Equipes />} />
                <Route path="departamentos" element={<Departamentos />} />
                <Route path="permissoes" element={<Permissoes />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="auditoria" element={<Auditoria />} />
              </Route>

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
