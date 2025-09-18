/**
 * Sistema de Validação de Dados Sensíveis - ETAPA 2
 * Data: 18 de Setembro de 2025
 */

export const sensitiveDataValidator = {
  cpf: (value: string): { isValid: boolean; errors: string[]; sanitized?: string } => {
    const errors: string[] = [];
    
    if (!value) {
      errors.push('CPF é obrigatório');
      return { isValid: false, errors };
    }
    
    const cleanCPF = value.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      errors.push('CPF deve conter 11 dígitos');
      return { isValid: false, errors, sanitized: cleanCPF };
    }
    
    const invalidSequences = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999'
    ];
    
    if (invalidSequences.includes(cleanCPF)) {
      errors.push('CPF inválido: sequência não permitida');
    }
    
    const formatted = `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9)}`;
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: formatted
    };
  },

  email: (value: string): { isValid: boolean; errors: string[]; sanitized?: string } => {
    const errors: string[] = [];
    
    if (!value) {
      errors.push('Email é obrigatório');
      return { isValid: false, errors };
    }
    
    const sanitized = value.toLowerCase().trim();
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
      errors.push('Formato de email inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  },

  sanitizeInput: (value: string): { isValid: boolean; errors: string[]; sanitized?: string } => {
    if (!value) return { isValid: true, errors: [], sanitized: '' };
    
    let sanitized = value;
    const errors: string[] = [];
    
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '');
    
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    if (sanitized.length > 1000) {
      sanitized = sanitized.slice(0, 1000);
      errors.push('Entrada truncada para 1000 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }
};