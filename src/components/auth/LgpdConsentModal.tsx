import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LgpdConsentModalProps {
  onAccept: (version: string) => Promise<void>;
}

export const LgpdConsentModal = ({ onAccept }: LgpdConsentModalProps) => {
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;

    setIsLoading(true);
    try {
      await onAccept('1.0.0');
      toast({
        title: 'Termos aceitos',
        description: 'Você pode agora utilizar a plataforma.',
      });
    } catch (error) {
      console.error('Erro ao aceitar termos:', error);
      toast({
        title: 'Erro ao aceitar termos',
        description: 'Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} modal>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Atualização dos Termos de Uso e Política de Privacidade
          </DialogTitle>
          <DialogDescription className="text-base pt-4">
            Para continuar utilizando nossa plataforma, precisamos que você aceite nossos Termos de Uso 
            e Política de Privacidade atualizados, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Termos de Uso</h3>
              <p className="text-sm text-muted-foreground">
                Ao utilizar nossa plataforma, você concorda com os termos e condições estabelecidos 
                para garantir uma experiência segura e eficiente para todos os usuários.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Política de Privacidade</h3>
              <p className="text-sm text-muted-foreground">
                Seus dados pessoais são tratados com total segurança e transparência. Utilizamos suas 
                informações apenas para os fins descritos em nossa política, respeitando seus direitos 
                de privacidade conforme a LGPD.
              </p>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                <strong>Principais pontos:</strong>
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                <li>Coleta e uso responsável de dados pessoais</li>
                <li>Direito de acesso, correção e exclusão dos seus dados</li>
                <li>Segurança e proteção das informações</li>
                <li>Transparência no tratamento de dados</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-lg border border-border bg-background">
            <Checkbox 
              id="lgpd-consent"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              disabled={isLoading}
            />
            <label 
              htmlFor="lgpd-consent" 
              className="text-sm leading-relaxed cursor-pointer select-none"
            >
              Li e concordo com os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong> 
              da plataforma, estando ciente de como meus dados serão tratados.
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleAccept}
            disabled={!accepted || isLoading}
            size="lg"
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
