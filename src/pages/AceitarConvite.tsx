
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ValidationResult {
  valid: boolean;
  invitation?: any;
  error?: string;
}

interface AcceptResult {
  success: boolean;
  message: string;
}

export default function AceitarConvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setValidationResult({ valid: false, error: 'Token de convite não encontrado' });
      setLoading(false);
    }
  }, [token]);

  const validateInvitation = async () => {
    if (!token) return;
    
    try {
      console.log('🔍 Validando convite com token:', token);
      setLoading(true);
      
      const { data, error } = await supabase.rpc('validate_invitation', {
        p_token: token
      });

      if (error) {
        console.error('❌ Erro na validação:', error);
        setValidationResult({ valid: false, error: error.message });
        return;
      }

      console.log('✅ Resultado da validação:', data);
      const result = (data as unknown) as ValidationResult;
      setValidationResult(result);
      
    } catch (error: any) {
      console.error('💥 Erro inesperado na validação:', error);
      setValidationResult({ 
        valid: false, 
        error: 'Erro interno ao validar convite. Tente novamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token || !user) {
      toast.error('Usuário não autenticado ou token inválido');
      return;
    }

    try {
      console.log('✅ Aceitando convite:', token);
      setAccepting(true);
      
      const { data, error } = await supabase.rpc('accept_invitation', {
        p_token: token,
        p_user_id: user.id
      });

      if (error) {
        console.error('❌ Erro ao aceitar convite:', error);
        toast.error('Erro ao aceitar convite: ' + error.message);
        return;
      }

      console.log('🎉 Convite aceito com sucesso:', data);
      const result = (data as unknown) as AcceptResult;
      
      if (result.success) {
        toast.success('Convite aceito com sucesso! Redirecionando...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast.error(result.message || 'Erro ao aceitar convite');
      }
      
    } catch (error: any) {
      console.error('💥 Erro inesperado ao aceitar:', error);
      toast.error('Erro interno ao aceitar convite. Tente novamente.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Validando convite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validationResult || !validationResult.valid) {
    const errorMessage = validationResult?.error || 'Convite inválido';
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Convite Inválido</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Possíveis motivos:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>O convite expirou</li>
                <li>O convite já foi aceito</li>
                <li>O link foi copiado incorretamente</li>
              </ul>
            </div>
            
            <Button onClick={() => navigate('/login')} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = validationResult.invitation;
  const isExpired = invitation && new Date(invitation.expires_at) < new Date();
  const isAlreadyAccepted = invitation && invitation.status === 'accepted';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            {isAlreadyAccepted ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : isExpired ? (
              <Clock className="h-6 w-6 text-yellow-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
          <CardTitle className="text-green-600">
            {isAlreadyAccepted 
              ? 'Convite Já Aceito' 
              : isExpired 
                ? 'Convite Expirado'
                : 'Convite Válido'
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium">Você foi convidado para:</p>
                <p className="text-2xl font-bold text-primary">{invitation.tenant?.name || 'Organização'}</p>
                <p className="text-muted-foreground">Como: {invitation.role}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email convidado:</span>
                  <span className="font-medium">{invitation.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Convite expira em:</span>
                  <span className="font-medium">
                    {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${
                    isAlreadyAccepted ? 'text-green-600' :
                    isExpired ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {isAlreadyAccepted ? 'Aceito' : isExpired ? 'Expirado' : 'Pendente'}
                  </span>
                </div>
              </div>

              {isAlreadyAccepted && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este convite já foi aceito. Você pode acessar o sistema normalmente.
                  </AlertDescription>
                </Alert>
              )}

              {isExpired && (
                <Alert variant="destructive">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Este convite expirou. Entre em contato com o administrador para receber um novo convite.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {!isAlreadyAccepted && !isExpired && user && (
                  <Button 
                    onClick={handleAcceptInvitation}
                    disabled={accepting}
                    className="flex-1"
                  >
                    {accepting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Aceitando...
                      </>
                    ) : (
                      'Aceitar Convite'
                    )}
                  </Button>
                )}
                
                {!user && (
                  <Button onClick={() => navigate('/login')} className="flex-1">
                    Fazer Login para Aceitar
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className={user && !isAlreadyAccepted && !isExpired ? "flex-1" : "w-full"}
                >
                  {isAlreadyAccepted ? 'Ir para Dashboard' : 'Cancelar'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
