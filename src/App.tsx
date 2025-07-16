
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Vendedores from "./pages/Vendedores";
import Clientes from "./pages/Clientes";
import Vendas from "./pages/Vendas";
import Comissoes from "./pages/Comissoes";
import Consorcios from "./pages/Consorcios";
import Escritorios from "./pages/Escritorios";
import Relatorios from "./pages/Relatorios";
import Auditoria from "./pages/Auditoria";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import { Toaster } from "sonner";
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import Equipes from "@/pages/Equipes";
import Departamentos from "@/pages/Departamentos";
import Permissoes from "@/pages/Permissoes";

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Index />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Dashboard />
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
            <Route path="/vendas" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Vendas />
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
            <Route path="/equipes" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Equipes />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/departamentos" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Departamentos />
                </ProtectedLayout>
              </ProtectedRoute>
            } />
            <Route path="/permissoes" element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Permissoes />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
