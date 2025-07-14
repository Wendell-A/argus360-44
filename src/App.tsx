import React from "react";
import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";

// Public pages
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Protected pages (existing)
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Vendedores from "./pages/Vendedores";
import Clientes from "./pages/Clientes";
import Consorcios from "./pages/Consorcios";
import Comissoes from "./pages/Comissoes";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
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

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Dashboard />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendedores"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Vendedores />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Clientes />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/consorcios"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Consorcios />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comissoes"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Comissoes />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Relatorios />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Configuracoes />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />

            {/* Catch all - 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
