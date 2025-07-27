import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Building, Users, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface LinkData {
  id: string;
  tenant_id: string;
  role: string;
  office_id?: string;
  department_id?: string;
  team_id?: string;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  metadata: any;
}

const roleNames = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  viewer: 'Visualizador',
};

export default function RegistrarComToken() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (token) {
      validateToken(token);
    }
  }, [token]);

  const validateToken = async (tokenValue: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('validate_public_invitation_token', {
        p_token: tokenValue
      });

      if (error) {
        console.error('Erro ao validar token:', error);
        setError('Erro ao validar o link de convite.');
        return;
      }

      const validationResult = data as unknown as { valid: boolean; error?: string; link_data?: LinkData };
      
      if (!validationResult?.valid) {
        setError(validationResult?.error || 'Link de convite inválido ou expirado.');
        return;
      }

      setLinkData(validationResult.link_data!);
      setError('');
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setError('Erro ao validar o link de convite.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !linkData) {
      toast.error('Token inválido');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setRegistering(true);

      // Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (authError) {
        console.error('Erro no registro:', authError);
        if (authError.message.includes('already registered')) {
          toast.error('Este email já está cadastrado. Faça login em vez de se registrar.');
        } else {
          toast.error('Erro ao criar conta: ' + authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário');
        return;
      }

      // Aceitar convite público
      const { data: acceptData, error: acceptError } = await supabase.rpc('accept_public_invitation', {
        p_token: token,
        p_user_id: authData.user.id,
        p_email: formData.email,
        p_full_name: formData.fullName
      });

      if (acceptError) {
        console.error('Erro ao aceitar convite:', acceptError);
        toast.error('Erro ao processar convite: ' + acceptError.message);
        return;
      }

      const acceptResult = acceptData as unknown as { success: boolean; error?: string };
      
      if (!acceptResult?.success) {
        toast.error(acceptResult?.error || 'Erro ao processar convite');
        return;
      }

      toast.success('Conta criada com sucesso! Você já está logado.');
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Erro no processo de registro:', error);
      toast.error('Erro interno: ' + error.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Validando link de convite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !linkData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Link Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="outline"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Você foi convidado para se cadastrar na plataforma
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informações do convite */}
          <Alert>
            <Building className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Perfil:</strong> {roleNames[linkData.role as keyof typeof roleNames]}</p>
                {linkData.max_uses && (
                  <p><strong>Usos:</strong> {linkData.current_uses}/{linkData.max_uses}</p>
                )}
                {linkData.expires_at && (
                  <p><strong>Expira em:</strong> {new Date(linkData.expires_at).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Formulário de registro */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                placeholder="Digite a senha novamente"
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={registering}
            >
              {registering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                  Criando conta...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Criar Conta
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Já tem uma conta?</p>
            <Button 
              variant="link" 
              onClick={() => navigate('/auth')}
              className="p-0 h-auto"
            >
              Fazer login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}