
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import Vendas from '@/pages/Vendas';
import Clientes from '@/pages/Clientes';
import Vendedores from '@/pages/Vendedores';
import Comissoes from '@/pages/Comissoes';
import Consorcios from '@/pages/Consorcios';
import Relatorios from '@/pages/Relatorios';
import Escritorios from '@/pages/Escritorios';
import Equipes from '@/pages/Equipes';
import Departamentos from '@/pages/Departamentos';
import Permissoes from '@/pages/Permissoes';
import Configuracoes from '@/pages/Configuracoes';
import Auditoria from '@/pages/Auditoria';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PublicRoute from '@/components/auth/PublicRoute';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import SimulacaoConsorcio from '@/pages/SimulacaoConsorcio';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/vendedores" element={<Vendedores />} />
            <Route path="/comissoes" element={<Comissoes />} />
            <Route path="/consorcios" element={<Consorcios />} />
            <Route path="/simulacao-consorcio" element={<SimulacaoConsorcio />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/escritorios" element={<Escritorios />} />
            <Route path="/equipes" element={<Equipes />} />
            <Route path="/departamentos" element={<Departamentos />} />
            <Route path="/permissoes" element={<Permissoes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/auditoria" element={<Auditoria />} />
          </Route>
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
