
import { z } from 'zod';

// Validação para documentos brasileiros
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

// Validação para telefones brasileiros
const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

// Esquemas de validação comuns
export const clientValidationSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  document: z.string()
    .min(1, 'Documento é obrigatório')
    .refine((doc) => {
      const cleanDoc = doc.replace(/\D/g, '');
      return cleanDoc.length === 11 || cleanDoc.length === 14;
    }, 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)'),
  
  phone: z.string()
    .optional()
    .refine((phone) => {
      if (!phone) return true;
      return phoneRegex.test(phone);
    }, 'Telefone deve estar no formato (00) 0000-0000 ou (00) 00000-0000'),
  
  type: z.enum(['individual', 'company'], {
    errorMap: () => ({ message: 'Tipo deve ser Pessoa Física ou Jurídica' })
  }),
  
  monthly_income: z.number()
    .positive('Renda deve ser um valor positivo')
    .optional(),
  
  birth_date: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 120;
    }, 'Data de nascimento deve resultar em idade entre 18 e 120 anos')
});

export const saleValidationSchema = z.object({
  client_id: z.string()
    .uuid('Cliente deve ser selecionado'),
  
  product_id: z.string()
    .uuid('Produto deve ser selecionado'),
  
  seller_id: z.string()
    .uuid('Vendedor deve ser selecionado'),
  
  office_id: z.string()
    .uuid('Escritório deve ser selecionado'),
  
  sale_value: z.number()
    .positive('Valor da venda deve ser positivo')
    .min(1000, 'Valor mínimo da venda é R$ 1.000,00'),
  
  down_payment: z.number()
    .min(0, 'Entrada não pode ser negativa')
    .optional(),
  
  installments: z.number()
    .int('Número de parcelas deve ser um número inteiro')
    .min(1, 'Deve ter pelo menos 1 parcela')
    .max(180, 'Máximo de 180 parcelas'),
  
  monthly_payment: z.number()
    .positive('Valor da parcela deve ser positivo'),
  
  commission_rate: z.number()
    .min(0, 'Taxa de comissão não pode ser negativa')
    .max(50, 'Taxa de comissão não pode exceder 50%'),
  
  sale_date: z.string()
    .refine((date) => {
      const saleDate = new Date(date);
      const today = new Date();
      return saleDate <= today;
    }, 'Data da venda não pode ser futura')
});

export const officeValidationSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres'),
  
  cnpj: z.string()
    .optional()
    .refine((cnpj) => {
      if (!cnpj) return true;
      return cnpjRegex.test(cnpj);
    }, 'CNPJ deve estar no formato 00.000.000/0000-00'),
  
  type: z.enum(['matriz', 'filial', 'representacao'], {
    errorMap: () => ({ message: 'Tipo deve ser Matriz, Filial ou Representação' })
  }),
  
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string()
      .optional()
      .refine((zip) => {
        if (!zip) return true;
        return /^\d{5}-?\d{3}$/.test(zip);
      }, 'CEP deve estar no formato 00000-000')
  }).optional()
});

export const commissionValidationSchema = z.object({
  commission_amount: z.number()
    .positive('Valor da comissão deve ser positivo'),
  
  due_date: z.string()
    .refine((date) => {
      const dueDate = new Date(date);
      const today = new Date();
      return dueDate >= today;
    }, 'Data de vencimento deve ser futura'),
  
  payment_method: z.string()
    .optional(),
  
  payment_reference: z.string()
    .optional(),
  
  notes: z.string()
    .max(500, 'Observações não podem exceder 500 caracteres')
    .optional()
});

// Validação para permissões
export const permissionValidationSchema = z.object({
  module: z.string()
    .min(1, 'Módulo é obrigatório')
    .max(50, 'Módulo não pode exceder 50 caracteres'),
  
  resource: z.string()
    .min(1, 'Recurso é obrigatório')
    .max(50, 'Recurso não pode exceder 50 caracteres'),
  
  actions: z.array(z.string())
    .min(1, 'Deve ter pelo menos uma ação')
    .max(10, 'Máximo de 10 ações por permissão')
});

// Helper para validar formulários
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Erro de validação desconhecido' } };
  }
};
