/**
 * Sistema de Normalização de Dimensões para Dashboard Personalizável
 * 
 * PROBLEMA: UI usa plural ("products", "sellers", "offices"), mas validação 
 * original usava singular ("product", "seller", "office"), causando conflitos.
 * 
 * SOLUÇÃO: Normalizar todas as dimensões para um padrão único (PLURAL)
 * e suportar aliases (PT/EN, plural/singular).
 */

export type CanonicalDimension = 'time' | 'products' | 'sellers' | 'offices' | 'clients';
export type DimensionAlias = string;

/**
 * Mapeamento de aliases para dimensões canônicas (PLURAL como padrão)
 */
const DIMENSION_ALIASES: Record<string, CanonicalDimension> = {
  // Time
  'time': 'time',
  'tempo': 'time',
  'date': 'time',
  'data': 'time',
  
  // Products
  'product': 'products',
  'products': 'products',
  'produto': 'products',
  'produtos': 'products',
  
  // Sellers
  'seller': 'sellers',
  'sellers': 'sellers',
  'vendedor': 'sellers',
  'vendedores': 'sellers',
  
  // Offices
  'office': 'offices',
  'offices': 'offices',
  'escritorio': 'offices',
  'escritórios': 'offices',
  'escritorios': 'offices',
  
  // Clients
  'client': 'clients',
  'clients': 'clients',
  'cliente': 'clients',
  'clientes': 'clients',
};

/**
 * Normaliza uma dimensão do eixo X para sua forma canônica
 * 
 * @param dimension - Dimensão em qualquer formato (singular/plural, PT/EN)
 * @returns Dimensão normalizada no formato canônico (plural)
 * 
 * @example
 * normalizeXAxis('product') // 'products'
 * normalizeXAxis('vendedores') // 'sellers'
 * normalizeXAxis('office') // 'offices'
 */
export function normalizeXAxis(dimension: string | undefined): CanonicalDimension {
  if (!dimension) return 'time';
  
  const normalized = dimension.toLowerCase().trim();
  const canonical = DIMENSION_ALIASES[normalized];
  
  if (!canonical) {
    console.warn(`[dimensions] Dimensão desconhecida: "${dimension}", usando 'time' como fallback`);
    return 'time';
  }
  
  return canonical;
}

/**
 * Verifica se uma dimensão é válida (possui mapeamento)
 */
export function isValidDimension(dimension: string | undefined): boolean {
  if (!dimension) return false;
  return dimension.toLowerCase().trim() in DIMENSION_ALIASES;
}

/**
 * Obtém rótulo traduzido para uma dimensão canônica
 */
export function getDimensionLabel(dimension: CanonicalDimension): string {
  const labels: Record<CanonicalDimension, string> = {
    'time': 'Tempo',
    'products': 'Produtos',
    'sellers': 'Vendedores',
    'offices': 'Escritórios',
    'clients': 'Clientes',
  };
  
  return labels[dimension] || dimension;
}

/**
 * Normaliza um tipo de dado (Y-axis) para formato padrão
 * (Já são usados no singular: 'sales', 'commissions', 'clients', 'goals')
 */
export type CanonicalDataType = 'sales' | 'commissions' | 'clients' | 'goals';

export function normalizeDataType(type: string | undefined): CanonicalDataType {
  if (!type) return 'sales';
  
  const normalized = type.toLowerCase().trim();
  const validTypes: CanonicalDataType[] = ['sales', 'commissions', 'clients', 'goals'];
  
  if (validTypes.includes(normalized as CanonicalDataType)) {
    return normalized as CanonicalDataType;
  }
  
  console.warn(`[dimensions] Tipo de dado desconhecido: "${type}", usando 'sales' como fallback`);
  return 'sales';
}
