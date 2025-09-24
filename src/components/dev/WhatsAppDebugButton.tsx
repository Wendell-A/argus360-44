import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Copy, ExternalLink } from 'lucide-react';
import { openWhatsApp, copyWhatsAppLink, generateWhatsAppLink } from '@/lib/whatsapp';
import { toast } from 'sonner';

interface WhatsAppDebugButtonProps {
  defaultPhone?: string;
  defaultMessage?: string;
}

export function WhatsAppDebugButton({ 
  defaultPhone = "11958937664", 
  defaultMessage = "Olá João Pereira da Silva! Como posso ajudá-lo hoje?" 
}: WhatsAppDebugButtonProps) {
  const [phone] = useState(defaultPhone);
  const [message] = useState(defaultMessage);

  const handleOpenWhatsApp = () => {
    openWhatsApp(phone, message);
    toast.success('Abrindo WhatsApp...');
  };

  const handleCopyLink = async () => {
    try {
      await copyWhatsAppLink(phone, message);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao copiar link');
    }
  };

  const generatedLink = generateWhatsAppLink(phone, message);

  // Só renderiza em DEV ou se waDebug=1 na URL
  const shouldShow = import.meta.env.DEV || 
    new URLSearchParams(window.location.search).get("waDebug") === "1";

  if (!shouldShow) return null;

  return (
    <Card className="border-dashed border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          WhatsApp Debug (REMOVÍVEL)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button 
            onClick={handleOpenWhatsApp}
            className="flex items-center gap-2"
            size="sm"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir WhatsApp (wa.me)
          </Button>
          <Button 
            onClick={handleCopyLink}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <Copy className="h-4 w-4" />
            Copiar Link
          </Button>
        </div>
        
        {import.meta.env.DEV && (
          <div className="text-xs text-muted-foreground">
            <p><strong>Phone:</strong> {phone}</p>
            <p><strong>Message:</strong> {message.substring(0, 50)}...</p>
            <p><strong>Generated URL:</strong> 
              <span className="font-mono break-all">{generatedLink}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}