
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import Clientes from "./pages/Clientes";
import Vendedores from "./pages/Vendedores";
import Comissoes from "./pages/Comissoes";
import Metas from "./pages/Metas";
import SimulacaoConsorcio from "./pages/SimulacaoConsorcio";
import Consorcios from "./pages/Consorcios";
import Relatorios from "./pages/Relatorios";
import Escritorios from "./pages/Escritorios";
import Equipes from "./pages/Equipes";
import Departamentos from "./pages/Departamentos";
import Permissoes from "./pages/Permissoes";
import Configuracoes from "./pages/Configuracoes";
import Auditoria from "./pages/Auditoria";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import Cargos from "./pages/Cargos";

// Configurar QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/auth/register" element={<PublicRoute><Register /></PublicRoute>} />
              
              <Route path="/dashboard" element={<ProtectedRoute><ProtectedLayout><Dashboard /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/vendas" element={<ProtectedRoute><ProtectedLayout><Vendas /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><ProtectedLayout><Clientes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/vendedores" element={<ProtectedRoute><ProtectedLayout><Vendedores /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/comissoes" element={<ProtectedRoute><ProtectedLayout><Comissoes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/metas" element={<ProtectedRoute><ProtectedLayout><Metas /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/simulacao-consorcio" element={<ProtectedRoute><ProtectedLayout><SimulacaoConsorcio /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/consorcios" element={<ProtectedRoute><ProtectedLayout><Consorcios /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><ProtectedLayout><Relatorios /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/escritorios" element={<ProtectedRoute><ProtectedLayout><Escritorios /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/equipes" element={<ProtectedRoute><ProtectedLayout><Equipes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/departamentos" element={<ProtectedRoute><ProtectedLayout><Departamentos /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/cargos" element={<ProtectedRoute><ProtectedLayout><Cargos /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/permissoes" element={<ProtectedRoute><ProtectedLayout><Permissoes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><ProtectedLayout><Configuracoes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/auditoria" element={<ProtectedRoute><ProtectedLayout><Auditoria /></ProtectedLayout></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
