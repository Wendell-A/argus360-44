import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminLogin = () => {
  const { signIn, isAuthenticated, loading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    pin: ''
  });

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Preencha email e senha');
      return;
    }

    setIsLoading(true);
    
    try {
      await signIn(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.full_name || !formData.pin) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    try {
      // Usar edge function para validar PIN e criar super admin
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          pin: formData.pin
        }
      });

      if (error) {
        toast.error('Erro ao criar administrador: ' + error.message);
        return;
      }

      if (data?.success) {
        toast.success('Super administrador criado com sucesso!');
        setIsCreateModalOpen(false);
        setFormData({ email: '', password: '', full_name: '', pin: '' });
      } else {
        toast.error(data?.error || 'Erro ao criar super administrador');
      }
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Voltar ao site */}
        <div className="text-center">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao site
          </Link>
        </div>

        <Card className="border-red-200">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900">
              Acesso Administrativo
            </CardTitle>
            <CardDescription className="text-red-700">
              Portal restrito para administradores do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Administrativo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@argus360.com"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
              </Button>
            </form>

            <div className="text-xs text-center text-muted-foreground mt-4 p-3 bg-red-50 rounded border border-red-200">
              <Shield className="w-4 h-4 inline mr-1" />
              Acesso restrito apenas para administradores do sistema Argus360
            </div>

            {/* Botão discreto para criar super admin */}
            <div className="text-center mt-4">
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-muted-foreground hover:text-red-600"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Criar Super Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Super Administrador</DialogTitle>
                    <DialogDescription>
                      Adicione um novo super administrador ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="create_full_name">Nome Completo</Label>
                      <Input
                        id="create_full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Nome completo do administrador"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="create_email">Email</Label>
                      <Input
                        id="create_email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="admin@argus360.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="create_password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="create_password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Senha segura"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="create_pin">PIN Secreto</Label>
                      <Input
                        id="create_pin"
                        type="password"
                        value={formData.pin}
                        onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
                        placeholder="Digite o PIN secreto"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-red-600 hover:bg-red-700">
                        Criar Administrador
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;