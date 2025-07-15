import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

// Pages
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Vendedores from "./pages/Vendedores";
import Vendas from "./pages/Vendas";
import Escritorios from "./pages/Escritorios";
import Clientes from "./pages/Clientes";
import Consorcios from "./pages/Consorcios";
import Comissoes from "./pages/Comissoes";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
            <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><ProtectedLayout><Dashboard /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/vendedores" element={<ProtectedRoute><ProtectedLayout><Vendedores /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><ProtectedLayout><Vendas /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/escritorios" element={<ProtectedRoute><ProtectedLayout><Escritorios /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><ProtectedLayout><Clientes /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/consorcios" element={<ProtectedRoute><ProtectedLayout><Consorcios /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/comissoes" element={<ProtectedRoute><ProtectedLayout><Comissoes /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><ProtectedLayout><Relatorios /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><ProtectedLayout><Configuracoes /></ProtectedLayout></ProtectedRoute>} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
