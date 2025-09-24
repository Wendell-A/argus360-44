
/**
 * Utilitários para integração com WhatsApp
 */

export interface WhatsAppMessage {
  phone: string;
  message: string;
}

/**
 * Gera um link direto para o WhatsApp com mensagem pré-definida
 * Usa formato wa.me/ que é o padrão oficial e evita bloqueios
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  // Validar se o telefone não está vazio
  if (!phone || !phone.trim()) {
    console.warn('WhatsApp: Telefone inválido ou vazio');
    return '#';
  }

  // Remove toda formatação do telefone
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Validar se tem pelo menos 10 dígitos
  if (cleanPhone.length < 10) {
    console.warn('WhatsApp: Telefone muito curto:', cleanPhone);
    return '#';
  }
  
  // Adiciona código do país Brasil (55) se não existir
  let formattedPhone = cleanPhone;
  if (!cleanPhone.startsWith('55')) {
    formattedPhone = `55${cleanPhone}`;
  }
  
  // Codifica a mensagem para URL
  const encodedMessage = encodeURIComponent(message || '');
  
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  // Log para debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('WhatsApp Link:', { phone, cleanPhone, formattedPhone, message, url: whatsappUrl });
  }
  
  return whatsappUrl;
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
 * Abre o WhatsApp em uma nova aba
 */
export function openWhatsApp(phone: string, message: string): void {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
}

/**
 * Copia link do WhatsApp para a área de transferência
 */
export function copyWhatsAppLink(phone: string, message: string): Promise<void> {
  const link = generateWhatsAppLink(phone, message);
  return navigator.clipboard.writeText(link);
}
