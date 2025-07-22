
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type MessageTemplate = Tables<'message_templates'>;
export type MessageTemplateInsert = TablesInsert<'message_templates'>;

export function useMessageTemplates(category?: string) {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['message_templates', activeTenant?.tenant_id, category],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      let queryBuilder = supabase
        .from('message_templates')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    templates: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function parseMessageTemplate(template: string, variables: Record<string, string>): string {
  let parsedTemplate = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    parsedTemplate = parsedTemplate.replace(regex, value || '');
  });
  
  return parsedTemplate;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  // Remove formatação do telefone
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Adicionar código do país se não tiver (assumindo Brasil)
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  // Codificar mensagem para URL
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}
