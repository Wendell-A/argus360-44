import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Users, 
  Target, 
  Shield, 
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  Rocket,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Download,
  Smile
} from 'lucide-react';

const Landing = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      icon: BarChart3,
      title: "Gestão de Vendas",
      description: "Controle completo do funil de vendas, desde o primeiro contato até a contemplação. Acompanhe cada oportunidade em tempo real."
    },
    {
      icon: Target,
      title: "Comissões Automáticas",
      description: "Cálculo e controle automático de comissões. Transparência total para vendedores e escritórios. Sem erros, sem retrabalho."
    },
    {
      icon: Users,
      title: "CRM Inteligente",
      description: "Base completa de clientes com histórico de interações, tarefas e oportunidades. Nunca perca um follow-up importante."
    }
  ];

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                argus360
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Recursos</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">Como Funciona</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Preços</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600 rounded-full">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        {/* Background Circle */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-400 to-blue-600 rounded-full -translate-y-1/4 translate-x-1/3 opacity-90 blur-3xl" />
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-block">
                <div className="w-12 h-12 bg-yellow-400 rounded-lg transform rotate-45" />
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Gestão de Consórcios
                <span className="block mt-2">
                  para seu Negócio
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Transforme incerteza em lucro previsível. Controle total de vendas, 
                comissões e clientes em uma plataforma moderna.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-lg shadow-lg">
                    Começar Grátis
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full px-8 py-6 text-lg border-2 hover:border-blue-600"
                >
                  Saber Mais
                </Button>
              </div>

              {/* Decorative Elements */}
              <div className="flex gap-4 pt-4">
                <div className="w-8 h-8 bg-cyan-400 rounded-lg" />
                <div className="w-8 h-8 bg-gray-300 rounded-lg" />
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      <span className="font-semibold text-gray-900">Dashboard</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full" />
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">5x</div>
                      <div className="text-sm text-gray-600">Mais Rápido</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="text-2xl font-bold text-green-600">15h</div>
                      <div className="text-sm text-gray-600">Foco/Mês</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="text-2xl font-bold text-purple-600">+2</div>
                      <div className="text-sm text-gray-600">Vendas</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="text-2xl font-bold text-orange-600">1m</div>
                      <div className="text-sm text-gray-600">ROI</div>
                    </div>
                  </div>

                  {/* Chart Preview */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-end justify-between h-32">
                      {[40, 65, 45, 80, 60, 95, 70].map((height, i) => (
                        <div 
                          key={i}
                          className="bg-blue-500 rounded-t-lg w-8 transition-all hover:bg-blue-600"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
                5x
              </div>
              <p className="text-gray-600 text-sm md:text-base">Orçamentos Rápidos</p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
                15h
              </div>
              <p className="text-gray-600 text-sm md:text-base">Foco a Mais</p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
                +2
              </div>
              <p className="text-gray-600 text-sm md:text-base">Vendas/Mês</p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
                1m
              </div>
              <p className="text-gray-600 text-sm md:text-base">ROI Garantido</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seu negócio de consórcios 
              de forma profissional e eficiente
            </p>
          </div>

          {/* Feature Carousel */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 shadow-xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  {React.createElement(features[currentFeature].icon, { 
                    className: "h-10 w-10 text-white" 
                  })}
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {features[currentFeature].title}
                </h3>
                
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                  {features[currentFeature].description}
                </p>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2 mb-8">
                  {features.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === currentFeature 
                          ? 'w-12 bg-blue-600' 
                          : 'w-2 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevFeature}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            
            <button
              onClick={nextFeature}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50 relative">
        {/* Decorative Wave Lines */}
        <div className="absolute left-20 top-1/2 w-64 h-64 opacity-10">
          <div className="absolute inset-0 border-2 border-blue-300 rounded-full" />
          <div className="absolute inset-4 border-2 border-blue-300 rounded-full" />
          <div className="absolute inset-8 border-2 border-blue-300 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Como Funciona?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left - Phone Mockup */}
            <div className="relative">
              <div className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl mx-auto max-w-sm">
                <div className="bg-white rounded-[2.5rem] p-6 h-[600px] overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-semibold">Dashboard</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-4 bg-gray-300 rounded" />
                      <div className="w-1 h-4 bg-gray-300 rounded" />
                      <div className="w-1 h-4 bg-gray-500 rounded" />
                    </div>
                  </div>

                  {/* Mock List Items */}
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-300 rounded w-3/4 mb-2" />
                          <div className="h-2 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Steps */}
            <div className="space-y-12">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Crie sua Conta
                  </h3>
                  <p className="text-gray-600">
                    Configure sua estrutura organizacional e adicione sua equipe 
                    em minutos. Interface intuitiva e guiada.
                  </p>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 flex justify-center">
                  <div className="w-0.5 h-12 bg-gradient-to-b from-blue-600 to-blue-400" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Importe seus Dados
                  </h3>
                  <p className="text-gray-600">
                    Migre facilmente suas planilhas e dados existentes. 
                    Suporte completo para garantir uma transição suave.
                  </p>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 flex justify-center">
                  <div className="w-0.5 h-12 bg-gradient-to-b from-blue-400 to-blue-300" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Smile className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Comece a Vender Mais
                  </h3>
                  <p className="text-gray-600">
                    Automação completa liberando sua equipe para focar em 
                    fechar negócios. Veja resultados em semanas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          {/* Background Gradient Circle */}
          <div className="absolute -top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-400 to-pink-400 rounded-full opacity-20 blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Gerencie Tudo com Este Sistema
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Pare de perder tempo com planilhas. Transforme incerteza em 
              lucro previsível e garantido com ROI em apenas 1 mês.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 py-6 text-lg shadow-lg">
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Dashboard Preview Image */}
            <div className="mt-12 relative">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 shadow-xl">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg" />
                    <div className="h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-lg" />
                    <div className="h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg" />
                  </div>
                  <div className="mt-4 h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg" />
                </div>
              </div>
            </div>
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
