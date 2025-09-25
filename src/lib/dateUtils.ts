/**
 * Utilidades para manipulação de datas sem problemas de fuso horário
 * 
 * @description Este arquivo contém funções para trabalhar com datas de forma consistente,
 * evitando problemas de conversão de fuso horário que fazem com que as datas sejam salvas
 * incorretamente no banco de dados.
 */

/**
 * Converte uma data para formato ISO local (YYYY-MM-DD) sem alterar o fuso horário
 * 
 * @param date - A data a ser convertida
 * @returns String no formato YYYY-MM-DD representando a data local
 * 
 * @example
 * // Se o usuário seleciona 30/09/2025, esta função retorna "2025-09-30"
 * // independente do fuso horário
 * const date = new Date(2025, 8, 30); // Mês é 0-indexado, então 8 = setembro
 * const isoLocal = toLocalISOString(date); // "2025-09-30"
 */
export function toLocalISOString(date: Date): string {
  if (!date || !(date instanceof Date)) {
    throw new Error('Data inválida fornecida');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma string de data local (YYYY-MM-DD) para um objeto Date
 * mantendo a data local sem conversões de fuso horário
 * 
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Objeto Date representando a data local
 * 
 * @example
 * const dateObj = fromLocalISOString("2025-09-30"); 
 * // Retorna uma data que representa 30/09/2025 no fuso local
 */
export function fromLocalISOString(dateString: string): Date {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('String de data inválida fornecida');
  }

  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day) {
    throw new Error('Formato de data inválido. Use YYYY-MM-DD');
  }

  // Cria a data usando o construtor local (mês é 0-indexado)
  return new Date(year, month - 1, day);
}

/**
 * Formata uma data para exibição em português brasileiro
 * 
 * @param date - A data a ser formatada
 * @param options - Opções de formatação (opcional)
 * @returns String formatada da data
 * 
 * @example
 * const date = new Date(2025, 8, 30);
 * formatDateBR(date); // "30/09/2025"
 */
export function formatDateBR(date: Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date || !(date instanceof Date)) {
    return '';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo' // Fuso horário do Brasil
  };

  return date.toLocaleDateString('pt-BR', { ...defaultOptions, ...options });
}

/**
 * Valida se uma string está no formato YYYY-MM-DD válido
 * 
 * @param dateString - String a ser validada
 * @returns true se válida, false caso contrário
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = fromLocalISOString(dateString);
  const backToString = toLocalISOString(date);
  
  return backToString === dateString;
}