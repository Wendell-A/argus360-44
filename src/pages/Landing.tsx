import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  BarChart3, 
  Users, 
  Target, 
  Shield, 
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  Rocket,
  ArrowRight
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Argus360
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
              Plataforma SaaS para Gestão de Consórcios
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Tempo é dinheiro.
              <span className="block text-blue-600 mt-2">
                Pare de gastar com planilhas
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Comece a investir em fechar mais negócios com o controle total de vendas, 
              comissões e clientes que transforma a incerteza em 
              <span className="text-blue-600 font-semibold"> lucro previsível e garantido</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/register">
                <Button size="lg" className="text-lg px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600">
                  Ver Demonstração
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Zap className="h-6 w-6 mr-2" />
                <p className="text-3xl md:text-4xl font-bold">5x</p>
              </div>
              <p className="text-sm md:text-base text-blue-100">Orçamentos mais rápidos</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Clock className="h-6 w-6 mr-2" />
                <p className="text-3xl md:text-4xl font-bold">15h</p>
              </div>
              <p className="text-sm md:text-base text-blue-100">Foco a mais por mês</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <TrendingUp className="h-6 w-6 mr-2" />
                <p className="text-3xl md:text-4xl font-bold">+2</p>
              </div>
              <p className="text-sm md:text-base text-blue-100">Vendas por vendedor/mês</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <DollarSign className="h-6 w-6 mr-2" />
                <p className="text-3xl md:text-4xl font-bold">1 mês</p>
              </div>
              <p className="text-sm md:text-base text-blue-100">Retorno do Investimento</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700">
              Funcionalidades
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Elimine a complexidade e ganhe produtividade com nossa plataforma completa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Gestão de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Controle completo do funil de vendas, desde o primeiro contato até a contemplação. 
                  Acompanhe cada oportunidade em tempo real.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Comissões Automáticas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Cálculo e controle automático de comissões. Transparência total para 
                  vendedores e escritórios. Sem erros, sem retrabalho.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">CRM Inteligente</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Base completa de clientes com histórico de interações, tarefas e 
                  oportunidades. Nunca perca um follow-up importante.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Relatórios Executivos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Dashboards intuitivos com métricas em tempo real. Tome decisões 
                  baseadas em dados concretos, não em achismos.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Automação Total</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Processos automatizados que economizam até 15 horas por mês. 
                  Foque no que importa: fechar negócios.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Rocket className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Multi-escritório</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Gerencie múltiplos escritórios com isolamento completo de dados 
                  e controles de acesso granulares. Escale com segurança.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para transformar incerteza em lucro garantido?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Comece seu teste gratuito hoje e veja o ROI em apenas 1 mês
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-lg px-10 py-6 bg-white text-blue-600 hover:bg-gray-100 shadow-lg">
                Começar Agora Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-10 py-6 border-2 border-white text-white hover:bg-white/10"
              >
                Falar com Especialista
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Argus360
            </h3>
            <p className="mt-2 text-gray-500">
              Plataforma SaaS para Gestão de Consórcios
            </p>
            
            {/* Admin Access */}
            <div className="mt-8 pt-4 border-t border-gray-800">
              <Link 
                to="/admin-login" 
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
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
