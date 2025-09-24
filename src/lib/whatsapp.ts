
/**
 * Utilitários para integração com WhatsApp
 */

export interface WhatsAppMessage {
  phone: string;
  message: string;
}

/**
 * Limpa e formata número de telefone
 */
function cleanPhoneNumber(phone: string): string | null {
  if (!phone || !phone.trim()) {
    console.warn('WhatsApp: Telefone inválido ou vazio');
    return null;
  }

  // Remove toda formatação do telefone
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Validar se tem pelo menos 10 dígitos
  if (cleanPhone.length < 10) {
    console.warn('WhatsApp: Telefone muito curto:', cleanPhone);
    return null;
  }
  
  // Adiciona código do país Brasil (55) se não existir
  let formattedPhone = cleanPhone;
  if (!cleanPhone.startsWith('55')) {
    formattedPhone = `55${cleanPhone}`;
  }
  
  return formattedPhone;
}

/**
 * Gera um link direto para o WhatsApp usando wa.me (simplificado)
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) return '#';
  
  // Encode message and replace %20 with + for better compatibility
  let encodedMessage = encodeURIComponent(message || '');
  encodedMessage = encodedMessage.replace(/%20/g, '+');
  
  const link = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  
  // Log para debug (apenas em desenvolvimento)
  if (import.meta.env.DEV) {
    console.log('WhatsApp Link Generated (wa.me):', { 
      phone, 
      cleanPhone,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''), 
      url: link 
    });
  }
  
  return link;
}

/**
 * Formata número de telefone brasileiro
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Valida se o número de telefone está no formato correto
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

/**
 * Parser de templates de mensagem
 */
export function parseMessageTemplate(
  template: string, 
  variables: Record<string, string | number>
): string {
  let parsedMessage = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    parsedMessage = parsedMessage.replace(regex, String(value || ''));
  });
  
  return parsedMessage;
}

/**
 * Abre o WhatsApp usando wa.me (simplificado)
 */
export function openWhatsApp(phone: string, message: string): void {
  const link = generateWhatsAppLink(phone, message);
  openLinkSafely(link);
}

/**
 * Abre link de forma segura com múltiplas tentativas
 */
function openLinkSafely(link: string): void {
  try {
    // Primeira tentativa: window.open padrão
    const win = window.open(link, '_blank', 'noopener,noreferrer');
    
    if (!win) {
      // Segunda tentativa: criar elemento anchor
      const a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error);
    
    // Terceira tentativa: window.top (se disponível)
    try {
      if (window.top && window.top !== window) {
        window.top.open(link, '_blank', 'noopener,noreferrer');
      }
    } catch (topError) {
      console.error('Todas as tentativas de abrir WhatsApp falharam:', topError);
    }
  }
}

/**
 * Copia link do WhatsApp para a área de transferência
 */
export function copyWhatsAppLink(phone: string, message: string): Promise<void> {
  const link = generateWhatsAppLink(phone, message);
  
  if (import.meta.env.DEV) {
    console.log('Copying WhatsApp link:', link);
  }
  
  return navigator.clipboard.writeText(link);
}
