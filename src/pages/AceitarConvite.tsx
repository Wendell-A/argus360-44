import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AceitarConvite() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // No sistema padrão Supabase, o processamento de convites é automático
    // quando o usuário se autentica. Verificamos se há convites pendentes.
    if (user) {
      processInvitation();
    }
  }, [user]);

  const processInvitation = async () => {
    if (!user?.email) return;

    try {
      console.log('🔍 Processando convites para:', user.email);
      
      const { data, error } = await supabase.rpc('process_invitation_on_auth', {
        p_user_id: user.id,
        p_email: user.email
      });

      if (error) {
        console.error('❌ Erro ao processar convite:', error);
        return;
      }

      console.log('✅ Resultado do processamento:', data);
      
      if (data && (data as any).success) {
        toast.success('Convite aceito com sucesso! Redirecionando...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        console.log('ℹ️ Nenhum convite pendente encontrado');
      }
      
    } catch (error: any) {
      console.error('💥 Erro inesperado ao processar convite:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-blue-600">Processando Convite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">
              Verificando convites pendentes...
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Sistema Padrão Supabase:</strong> O processamento de convites agora é automático. 
              Se você foi convidado, faça login e será adicionado automaticamente à organização.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            {!user ? (
              <Button onClick={() => navigate('/login')} className="w-full">
                Fazer Login para Aceitar Convite
              </Button>
            ) : (
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Ir para Dashboard
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
