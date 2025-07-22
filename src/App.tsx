
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"

import { AuthProvider } from "./contexts/AuthContext";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Vendas from "./pages/Vendas";
import Vendedores from "./pages/Vendedores";
import Comissoes from "./pages/Comissoes";
import Consorcios from "./pages/Consorcios";
import SimulacaoConsorcio from "./pages/SimulacaoConsorcio";
import Metas from "./pages/Metas";
import Relatorios from "./pages/Relatorios";
import Escritorios from "./pages/Escritorios";
import Equipes from "./pages/Equipes";
import Departamentos from "./pages/Departamentos";
import Cargos from "./pages/Cargos";
import Permissoes from "./pages/Permissoes";
import Auditoria from "./pages/Auditoria";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import CRM from "./pages/CRM";
import { ClientModal } from "./components/ClientModal";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />

              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Dashboard />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/clientes" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Clientes />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/crm" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <CRM />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendas" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Vendas />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendedores" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Vendedores />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/comissoes" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Comissoes />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/consorcios" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Consorcios />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/simulacao-consorcio" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <SimulacaoConsorcio />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/metas" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Metas />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/relatorios" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Relatorios />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/escritorios" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Escritorios />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/equipes" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Equipes />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/departamentos" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Departamentos />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cargos" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Cargos />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/permissoes" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Permissoes />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/auditoria" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Auditoria />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuracoes" 
                element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Configuracoes />
                    </ProtectedLayout>
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
