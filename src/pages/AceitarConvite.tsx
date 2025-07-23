
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, Building, UserCheck } from 'lucide-react';

const roleNames = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  viewer: 'Visualizador'
};

interface ValidationResult {
  valid: boolean;
  invitation?: any;
  error?: string;
}

interface AcceptResult {
  success: boolean;
  error?: string;
  tenant_id?: string;
  role?: string;
}

export default function AceitarConvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      const { data, error } = await supabase.rpc('validate_invitation', {
        invitation_token: token
      });

      if (error) throw error;

      const result = data as ValidationResult;
      if (result.valid) {
        setInvitation(result.invitation);
      } else {
        toast.error(result.error || 'Convite inválido');
        navigate('/auth/login');
      }
    } catch (error: any) {
      toast.error('Erro ao validar convite: ' + error.message);
      navigate('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation || !token) return;

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsAccepting(true);

    try {
      // Se usuário já está logado, apenas aceita o convite
      if (user) {
        const { data, error } = await supabase.rpc('accept_invitation', {
          invitation_token: token,
          user_id: user.id,
          user_email: user.email,
          user_full_name: user.user_metadata?.full_name || user.email
        });

        if (error) throw error;

        const result = data as AcceptResult;
        if (result.success) {
          toast.success('Convite aceito com sucesso!');
          navigate('/');
        } else {
          toast.error(result.error || 'Erro ao aceitar convite');
        }
      } else {
        // Criar nova conta e aceitar convite
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: invitation.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const { data: acceptData, error: acceptError } = await supabase.rpc('accept_invitation', {
            invitation_token: token,
            user_id: signUpData.user.id,
            user_email: invitation.email,
            user_full_name: formData.fullName
          });

          if (acceptError) throw acceptError;

          const result = acceptData as AcceptResult;
          if (result.success) {
            toast.success('Conta criada e convite aceito com sucesso!');
            navigate('/');
          } else {
            toast.error(result.error || 'Erro ao aceitar convite');
          }
        }
      }
    } catch (error: any) {
      toast.error('Erro ao aceitar convite: ' + error.message);
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Convite Inválido</h2>
              <p className="text-muted-foreground mb-4">
                Este convite não é válido ou já expirou.
              </p>
              <Button onClick={() => navigate('/auth/login')}>
                Ir para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserCheck className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle>Aceitar Convite</CardTitle>
          <p className="text-sm text-muted-foreground">
            Você foi convidado para participar da organização
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
              </div>
              <p className="text-sm">{invitation.email}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Função:</span>
              </div>
              <Badge variant="outline">
                {roleNames[invitation.role as keyof typeof roleNames] || invitation.role}
              </Badge>
            </div>
          </div>

          {!user && (
            <form onSubmit={handleAcceptInvitation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Crie uma senha"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirme sua senha"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isAccepting || !formData.fullName || !formData.password || !formData.confirmPassword}
              >
                {isAccepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando conta...
                  </>
                ) : (
                  'Aceitar Convite e Criar Conta'
                )}
              </Button>
            </form>
          )}

          {user && (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Você já está logado como {user.email}
              </p>
              <Button
                onClick={handleAcceptInvitation}
                className="w-full"
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Aceitando convite...
                  </>
                ) : (
                  'Aceitar Convite'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
