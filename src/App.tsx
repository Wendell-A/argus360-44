
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import CRM from '@/pages/CRM';
import Clientes from '@/pages/Clientes';
import Vendas from '@/pages/Vendas';
import Inadimplentes from '@/pages/Inadimplentes';
import Vendedores from '@/pages/Vendedores';
import Comissoes from '@/pages/comissoes';
import ComissoesEscritorio from '@/pages/comissoes/ComissoesEscritorio';
import ComissoesVendedores from '@/pages/comissoes/ComissoesVendedores';
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
import Proposals from '@/pages/Proposals';
import Training from '@/pages/Training';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import AceitarConvite from '@/pages/AceitarConvite';
import RegistrarComToken from '@/pages/RegistrarComToken';

// Admin imports
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import SuperAdmins from '@/pages/admin/SuperAdmins';
import AdminTraining from '@/pages/admin/AdminTraining';
import AdminSupport from '@/pages/admin/AdminSupport';
import AdminLayout from '@/components/layout/AdminLayout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <AuthProvider>
          <ThemeProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                
                {/* Admin Routes */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin/*" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="super-admins" element={<SuperAdmins />} />
                  <Route path="training" element={<AdminTraining />} />
                  <Route path="support" element={<AdminSupport />} />
                  {/* Placeholder routes for future admin pages */}
                  <Route path="tenants" element={<div className="p-6"><h1 className="text-2xl font-bold">Gestão de Tenants</h1><p className="text-muted-foreground">Em desenvolvimento...</p></div>} />
                  <Route path="payments" element={<div className="p-6"><h1 className="text-2xl font-bold">Gestão de Pagamentos</h1><p className="text-muted-foreground">Em desenvolvimento...</p></div>} />
                  <Route path="monitor" element={<div className="p-6"><h1 className="text-2xl font-bold">Monitor do Sistema</h1><p className="text-muted-foreground">Em desenvolvimento...</p></div>} />
                  <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Configurações Admin</h1><p className="text-muted-foreground">Em desenvolvimento...</p></div>} />
                </Route>
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
                <Route path="/inadimplentes" element={<Inadimplentes />} />
                <Route path="/vendedores" element={<Vendedores />} />
                <Route path="/comissoes" element={<Comissoes />} />
                <Route path="/comissoes/escritorio" element={<ComissoesEscritorio />} />
                <Route path="/comissoes/vendedores" element={<ComissoesVendedores />} />
                <Route path="/consorcios" element={<Consorcios />} />
                <Route path="/simulacao-consorcio" element={<SimulacaoConsorcio />} />
                <Route path="/proposals" element={<Proposals />} />
                <Route path="/training" element={<Training />} />
                <Route path="/suporte" element={<Suporte />} />
                <Route path="/perfil" element={<Profile />} />
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
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
