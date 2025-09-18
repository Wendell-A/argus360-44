/**
 * Sistema de Mascaramento de Dados Sensíveis - ETAPA 2
 * Data: 18 de Setembro de 2025
 */

import { DataSensitivity } from './DataClassification';

export const maskSensitiveData = {
  cpf: (cpf: string): string => {
    if (!cpf) return '';
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})\d{3}\d{3}(\d{2})/, '$1.***.***-$2');
  },

  cnpj: (cnpj: string): string => {
    if (!cnpj) return '';
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})\d{3}\d{3}\/\d{3}(\d)(\d{2})/, '$1.***.***/***$2-$3');
  },

  phone: (phone: string): string => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11) {
      return phone.replace(/(\(\d{2}\)\s?)\d{4}(\d{2})(\d{2})/, '$1****-**$2$3');
    } else if (cleanPhone.length === 10) {
      return phone.replace(/(\(\d{2}\)\s?)\d{3}(\d{2})(\d{2})/, '$1***-**$2$3');
    }
    
    return phone.replace(/\d/g, '*');
  },

  email: (email: string): string => {
    if (!email || !email.includes('@')) return email;
    
    const [user, domain] = email.split('@');
    if (user.length <= 1 || domain.length <= 4) return email;
    
    const maskedUser = user.charAt(0) + '***';
    const domainParts = domain.split('.');
    const maskedDomain = '***' + (domainParts.length > 1 ? '.' + domainParts[domainParts.length - 1] : '');
    
    return `${maskedUser}@${maskedDomain}`;
  }
};

export function maskObjectSensitiveData<T extends Record<string, any>>(
  obj: T, 
  showSensitive: boolean = false
): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const masked = { ...obj };
  
  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue;
    
    if (!showSensitive) {
      if (/cpf/i.test(key)) {
        masked[key as keyof T] = maskSensitiveData.cpf(String(value));
      } else if (/cnpj/i.test(key)) {
        masked[key as keyof T] = maskSensitiveData.cnpj(String(value));
      } else if (/phone|telefone/i.test(key)) {
        masked[key as keyof T] = maskSensitiveData.phone(String(value));
      } else if (/email/i.test(key)) {
        masked[key as keyof T] = maskSensitiveData.email(String(value));
      }
    }
  }
  
  return masked;
}