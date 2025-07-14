
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Users, BarChart3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: 'Gestão Multi-tenant',
      description: 'Gerencie múltiplas organizações e usuários em uma única plataforma.'
    },
    {
      icon: Shield,
      title: 'Segurança Avançada',
      description: 'Controle de acesso granular e auditoria completa de todas as operações.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Detalhados',
      description: 'Dashboards e relatórios personalizados para cada área do negócio.'
    }
  ];

  const benefits = [
    'Controle total de usuários e permissões',
    'Auditoria completa de ações do sistema',
    'Interface moderna e responsiva',
    'Suporte a múltiplas organizações',
    'Relatórios e dashboards personalizados',
    'Integração com sistemas externos'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Argus360</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Gestão Empresarial Completa
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Plataforma moderna para gestão de usuários, organizações e processos empresariais 
          com segurança e controle total.
        </p>
        <div className="space-x-4">
          <Button size="lg" asChild>
            <Link to="/register">
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Já tenho conta</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Funcionalidades Principais
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center">
                <CardHeader>
                  <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Por que escolher o Argus360?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nossa plataforma oferece tudo que você precisa para gerenciar 
                sua empresa de forma eficiente e segura.
              </p>
              <Button size="lg" asChild>
                <Link to="/register">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              Pronto para começar?
            </CardTitle>
            <CardDescription className="text-lg">
              Crie sua conta gratuita e comece a gerenciar sua empresa hoje mesmo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-x-4">
            <Button size="lg" asChild>
              <Link to="/register">Criar Conta Gratuita</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 Argus360. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
