import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BarChart3, Users, Target, Shield, Zap } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Argus360</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/register">
                <Button>Começar Grátis</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Sistema de Gestão de Consórcios
          </Badge>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Gerencie seu negócio de
            <span className="text-blue-600"> consórcios</span> com inteligência
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Plataforma completa para administradoras e corretoras de consórcio. 
            Controle vendas, comissões, clientes e relatórios em um só lugar.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Começar Teste Grátis
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Funcionalidades Principais
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Tudo que você precisa para gerenciar seu negócio de consórcios
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <CardTitle>Gestão de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Controle completo do processo de vendas, desde o lead até a contemplação.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-green-600" />
                  <CardTitle>Controle de Comissões</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Automatize o cálculo e pagamento de comissões para vendedores e escritórios.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-purple-600" />
                  <CardTitle>Gestão de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Base completa de clientes com histórico de relacionamento e vendas.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-red-600" />
                  <CardTitle>Relatórios Avançados</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Dashboards e relatórios detalhados para tomada de decisão estratégica.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-yellow-600" />
                  <CardTitle>Automação</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Processos automatizados que economizam tempo e reduzem erros.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle className="h-8 w-8 text-indigo-600" />
                  <CardTitle>Multi-tenant</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Suporte a múltiplos escritórios com isolamento completo de dados.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">Argus360</h3>
            <p className="mt-2 text-gray-400">
              Sistema de Gestão de Consórcios
            </p>
            
            {/* Admin Access - Discreto */}
            <div className="mt-8 pt-4 border-t border-gray-700">
              <Link 
                to="/admin-login" 
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
