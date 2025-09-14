
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import CRM from '@/pages/CRM';
import Clientes from '@/pages/Clientes';
import Vendas from '@/pages/Vendas';
import Vendedores from '@/pages/Vendedores';
import Comissoes from '@/pages/Comissoes';
import Consorcios from '@/pages/Consorcios';
import SimulacaoConsorcio from '@/pages/SimulacaoConsorcio';
import Metas from '@/pages/Metas';
import Relatorios from '@/pages/Relatorios';
import Escritorios from '@/pages/Escritorios';
import Departamentos from '@/pages/Departamentos';
import Cargos from '@/pages/Cargos';
import Equipes from '@/pages/Equipes';
import Usuarios from '@/pages/Usuarios';
import Convites from '@/pages/Convites';
import Permissoes from '@/pages/Permissoes';
import Configuracoes from '@/pages/Configuracoes';
import Auditoria from '@/pages/Auditoria';
import AuditoriaSeguranca from '@/pages/AuditoriaSeguranca';
import Suporte from '@/pages/Suporte';
import NotFound from '@/pages/NotFound';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import AceitarConvite from '@/pages/AceitarConvite';
import RegistrarComToken from '@/pages/RegistrarComToken';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/aceitar-convite/:token" element={<AceitarConvite />} />
              <Route path="/registrar-com-token/:token" element={<RegistrarComToken />} />
              
              {/* Rotas Protegidas */}
              <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/vendas" element={<Vendas />} />
                <Route path="/vendedores" element={<Vendedores />} />
                <Route path="/comissoes" element={<Comissoes />} />
                <Route path="/consorcios" element={<Consorcios />} />
                <Route path="/simulacao-consorcio" element={<SimulacaoConsorcio />} />
                <Route path="/suporte" element={<Suporte />} />
                <Route path="/metas" element={<Metas />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/escritorios" element={<Escritorios />} />
                <Route path="/departamentos" element={<Departamentos />} />
                <Route path="/cargos" element={<Cargos />} />
                <Route path="/equipes" element={<Equipes />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/convites" element={<Convites />} />
                <Route path="/permissoes" element={<Permissoes />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/auditoria" element={<Auditoria />} />
                <Route path="/auditoria-seguranca" element={<AuditoriaSeguranca />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
