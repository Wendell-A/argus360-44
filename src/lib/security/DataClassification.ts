/**
 * Sistema de Classificação de Dados - ETAPA 1
 * Data: 29 de Janeiro de 2025, 13:45 UTC
 * 
 * Sistema robusto para classificar dados por sensibilidade e aplicar
 * estratégias de cache e segurança adequadas para cada tipo.
 */

export enum DataSensitivity {
  CRITICAL = 'CRITICAL',    // Nunca cachear (passwords, tokens, secrets)
  PERSONAL = 'PERSONAL',    // Cache criptografado apenas (CPF, email, phone)
  BUSINESS = 'BUSINESS',    // Cache com TTL curto (valores, comissões)
  PUBLIC = 'PUBLIC'         // Cache normal (nomes, categorias, status)
}

export const DATA_CLASSIFICATION = {
  CRITICAL: [
    'password', 'token', 'secret', 'api_key', 
    'private_key', 'session_token', 'refresh_token',
    'auth_token', 'jwt', 'access_token',
    'encryption_key', 'private_data'
  ],
  PERSONAL: [
    'cpf', 'document', 'email', 'phone', 'birth_date', 
    'address', 'full_name', 'rg', 'passport',
    'secondary_phone', 'personal_email', 'home_address',
    'identification_number', 'social_security'
  ],
  BUSINESS: [
    'commission_amount', 'sale_value', 'contract_number',
    'bank_account', 'profit_margin', 'monthly_payment',
    'commission_rate', 'down_payment', 'installment_amount',
    'target_amount', 'current_amount', 'monthly_income'
  ],
  PUBLIC: [
    'product_name', 'office_name', 'department_name',
    'category', 'status', 'type', 'name', 'description',
    'title', 'priority', 'color', 'icon', 'slug'
  ]
} as const;

/**
 * Classificar um campo individual baseado no nome
 */
export function classifyField(fieldName: string): DataSensitivity {
  const lowerFieldName = fieldName.toLowerCase();
  
  for (const [sensitivity, fields] of Object.entries(DATA_CLASSIFICATION)) {
    if (fields.some(field => lowerFieldName.includes(field.toLowerCase()))) {
      return sensitivity as DataSensitivity;
    }
  }
  
  // Default para PUBLIC se não encontrar classificação específica
  return DataSensitivity.PUBLIC;
}

/**
 * Classificar um objeto completo e retornar mapa de sensibilidades
 */
export function classifyObject(obj: Record<string, any>): Record<string, DataSensitivity> {
  const classification: Record<string, DataSensitivity> = {};
  
  for (const key in obj) {
    classification[key] = classifyField(key);
  }
  
  return classification;
}

/**
 * Obter a sensibilidade máxima de um objeto
 */
export function getMaxSensitivity(obj: Record<string, any>): DataSensitivity {
  const classifications = Object.values(classifyObject(obj));
  
  if (classifications.includes(DataSensitivity.CRITICAL)) return DataSensitivity.CRITICAL;
  if (classifications.includes(DataSensitivity.PERSONAL)) return DataSensitivity.PERSONAL;
  if (classifications.includes(DataSensitivity.BUSINESS)) return DataSensitivity.BUSINESS;
  
  return DataSensitivity.PUBLIC;
}

/**
 * Verificar se um objeto contém dados sensíveis
 */
export function containsSensitiveData(obj: Record<string, any>): boolean {
  return getMaxSensitivity(obj) !== DataSensitivity.PUBLIC;
}

/**
 * Sanitizar objeto removendo campos críticos
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T, 
  allowedSensitivity: DataSensitivity = DataSensitivity.BUSINESS
): Partial<T> {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  const sensitivityOrder = [
    DataSensitivity.PUBLIC,
    DataSensitivity.BUSINESS, 
    DataSensitivity.PERSONAL,
    DataSensitivity.CRITICAL
  ];
  
  const maxAllowedIndex = sensitivityOrder.indexOf(allowedSensitivity);
  
  for (const [key, value] of Object.entries(obj)) {
    const fieldSensitivity = classifyField(key);
    const fieldIndex = sensitivityOrder.indexOf(fieldSensitivity);
    
    if (fieldIndex > maxAllowedIndex) {
      delete (sanitized as any)[key];
      console.warn(`Campo ${fieldSensitivity} removido do cache: ${key}`);
    }
  }
  
  return sanitized;
}

/**
 * Estratégias de TTL por sensibilidade
 */
export const TTL_STRATEGIES = {
  [DataSensitivity.CRITICAL]: 0,           // Nunca cachear
  [DataSensitivity.PERSONAL]: 5 * 60 * 1000,  // 5 minutos
  [DataSensitivity.BUSINESS]: 10 * 60 * 1000, // 10 minutos  
  [DataSensitivity.PUBLIC]: 30 * 60 * 1000    // 30 minutos
} as const;

/**
 * Obter TTL recomendado para um tipo de sensibilidade
 */
export function getRecommendedTTL(sensitivity: DataSensitivity): number {
  return TTL_STRATEGIES[sensitivity];
}