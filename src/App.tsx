
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { Toaster } from './components/ui/sonner';
import Index from './pages/Index';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Vendedores from './pages/Vendedores';
import Clientes from './pages/Clientes';
import Vendas from './pages/Vendas';
import Comissoes from './pages/Comissoes';
import Escritorios from './pages/Escritorios';
import Equipes from './pages/Equipes';
import Consorcios from './pages/Consorcios';
import SimulacaoConsorcio from './pages/SimulacaoConsorcio';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Departamentos from './pages/Departamentos';
import Cargos from './pages/Cargos';
import Metas from './pages/Metas';
import CRM from './pages/CRM';
import Auditoria from './pages/Auditoria';
import Permissoes from './pages/Permissoes';
import Convites from './pages/Convites';
import AceitarConvite from './pages/AceitarConvite';
import RegistrarComToken from './pages/RegistrarComToken';
import NotFound from './pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
              <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/auth/register" element={<PublicRoute><Register /></PublicRoute>} />
              
              {/* Invitation Route - Can be accessed by both authenticated and unauthenticated users */}
        <Route path="/aceitar-convite/:token" element={<AceitarConvite />} />
        <Route path="/registrar/:token" element={<RegistrarComToken />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><ProtectedLayout><Dashboard /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/vendedores" element={<ProtectedRoute><ProtectedLayout><Vendedores /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><ProtectedLayout><Clientes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/vendas" element={<ProtectedRoute><ProtectedLayout><Vendas /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/comissoes" element={<ProtectedRoute><ProtectedLayout><Comissoes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/escritorios" element={<ProtectedRoute><ProtectedLayout><Escritorios /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/equipes" element={<ProtectedRoute><ProtectedLayout><Equipes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/consorcios" element={<ProtectedRoute><ProtectedLayout><Consorcios /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/simulacao-consorcio" element={<ProtectedRoute><ProtectedLayout><SimulacaoConsorcio /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><ProtectedLayout><Relatorios /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><ProtectedLayout><Configuracoes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/departamentos" element={<ProtectedRoute><ProtectedLayout><Departamentos /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/cargos" element={<ProtectedRoute><ProtectedLayout><Cargos /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/metas" element={<ProtectedRoute><ProtectedLayout><Metas /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute><ProtectedLayout><CRM /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/auditoria" element={<ProtectedRoute><ProtectedLayout><Auditoria /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/permissoes" element={<ProtectedRoute><ProtectedLayout><Permissoes /></ProtectedLayout></ProtectedRoute>} />
              <Route path="/convites" element={<ProtectedRoute><ProtectedLayout><Convites /></ProtectedLayout></ProtectedRoute>} />
              
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
