/**
 * Secure Cache Manager - ETAPA 1
 * Data: 29 de Janeiro de 2025, 13:50 UTC
 * 
 * Sistema de cache seguro com isolamento por tenant, criptografia
 * para dados sensíveis e auditoria completa de acessos.
 */

import { 
  DataSensitivity, 
  sanitizeObject, 
  getRecommendedTTL,
  containsSensitiveData,
  classifyField 
} from './DataClassification';
import { monitoring } from '@/lib/monitoring';

interface SecureCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  sensitivity: DataSensitivity;
  tenantId: string;
  userId: string;
  encrypted: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  securityViolations: number;
  encryptedEntries: number;
}

export class SecureCacheManager {
  private cache = new Map<string, SecureCacheEntry<any>>();
  private stats: CacheStats = { 
    hits: 0, 
    misses: 0, 
    sets: 0, 
    deletes: 0, 
    securityViolations: 0,
    encryptedEntries: 0 
  };
  private maxSize = 1000;
  private currentTenantId: string = '';
  private currentUserId: string = '';

  /**
   * Configurar contexto de tenant e usuário
   */
  setContext(tenantId: string, userId: string): void {
    this.currentTenantId = tenantId;
    this.currentUserId = userId;
  }

  /**
   * Método principal para armazenar dados no cache
   */
  async set<T>(
    key: string, 
    data: T, 
    sensitivity: DataSensitivity, 
    ttl?: number
  ): Promise<void> {
    // 1. Validar contexto
    if (!this.currentTenantId || !this.currentUserId) {
      console.warn('Cache context não configurado. Chamando setContext primeiro.');
      return;
    }

    // 2. Construir chave segura com isolamento
    const secureKey = this.buildSecureKey(key);
    
    // 3. Verificar se devemos cachear este tipo de dado
    if (sensitivity === DataSensitivity.CRITICAL) {
      console.warn(`Tentativa de cache de dados CRITICAL bloqueada: ${key}`);
      this.recordSecurityViolation('CRITICAL_DATA_CACHE_ATTEMPT', { key, sensitivity });
      return;
    }

    // 4. Sanitizar dados baseado na sensibilidade
    const sanitizedData = sanitizeObject(data as any, sensitivity);
    
    // 5. Definir TTL baseado na sensibilidade
    const actualTTL = ttl || getRecommendedTTL(sensitivity);
    
    // 6. Limpar cache se necessário
    if (this.cache.size >= this.maxSize) {
      await this.cleanup();
    }

    // 7. Criptografar dados pessoais
    let finalData: any = sanitizedData;
    let encrypted = false;
    
    if (sensitivity === DataSensitivity.PERSONAL) {
      finalData = await this.encrypt(sanitizedData);
      encrypted = true;
      this.stats.encryptedEntries++;
    }

    // 8. Armazenar no cache
    const entry: SecureCacheEntry<any> = {
      data: finalData,
      timestamp: Date.now(),
      ttl: actualTTL,
      key: secureKey,
      sensitivity,
      tenantId: this.currentTenantId,
      userId: this.currentUserId,
      encrypted
    };

    this.cache.set(secureKey, entry);
    this.stats.sets++;

    // 9. Auditoria
    await this.auditCacheOperation('SET', secureKey, sensitivity);
  }

  /**
   * Método principal para recuperar dados do cache
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Validar contexto
    if (!this.currentTenantId || !this.currentUserId) {
      console.warn('Cache context não configurado');
      return null;
    }

    // 2. Construir chave segura
    const secureKey = this.buildSecureKey(key);
    const entry = this.cache.get(secureKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 3. Verificar isolamento de tenant
    if (entry.tenantId !== this.currentTenantId) {
      this.recordSecurityViolation('TENANT_ISOLATION_VIOLATION', {
        requestedKey: secureKey,
        expectedTenant: this.currentTenantId,
        foundTenant: entry.tenantId
      });
      this.stats.securityViolations++;
      return null;
    }

    // 4. Verificar expiração
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(secureKey);
      this.stats.misses++;
      return null;
    }

    // 5. Descriptografar se necessário
    let data = entry.data;
    if (entry.encrypted) {
      data = await this.decrypt(entry.data);
    }

    this.stats.hits++;
    
    // 6. Auditoria
    await this.auditCacheOperation('GET', secureKey, entry.sensitivity);
    
    return data as T;
  }

  /**
   * Deletar entrada específica
   */
  delete(key: string): boolean {
    const secureKey = this.buildSecureKey(key);
    const deleted = this.cache.delete(secureKey);
    
    if (deleted) {
      this.stats.deletes++;
    }
    
    return deleted;
  }

  /**
   * Invalidar cache por pattern com segurança
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const tenantPrefix = `${this.currentTenantId}_${this.currentUserId}_`;
    const securePattern = `${tenantPrefix}${pattern}`;
    const regex = new RegExp(securePattern);
    
    for (const [key, entry] of this.cache.entries()) {
      // Verificar isolamento de tenant antes de deletar
      if (entry.tenantId === this.currentTenantId && regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.deletes += count;
    return count;
  }

  /**
   * Construir chave segura com isolamento total
   */
  private buildSecureKey(key: string): string {
    return `${this.currentTenantId}_${this.currentUserId}_${key}`;
  }

  /**
   * Criptografar dados sensíveis (simulação - implementar com crypto real)
   */
  private async encrypt(data: any): Promise<string> {
    // TODO: Implementar criptografia real com Web Crypto API
    // Por enquanto, usar base64 como placeholder
    const jsonString = JSON.stringify(data);
    return btoa(jsonString);
  }

  /**
   * Descriptografar dados
   */
  private async decrypt(encryptedData: string): Promise<any> {
    // TODO: Implementar descriptografia real
    try {
      const jsonString = atob(encryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Erro ao descriptografar dados do cache:', error);
      return null;
    }
  }

  /**
   * Limpeza inteligente do cache
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // 1. Remover entradas expiradas
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });

    // 2. Se ainda estiver cheio, remover as mais antigas do tenant atual
    if (this.cache.size >= this.maxSize) {
      const currentTenantEntries = entries
        .filter(([_, entry]) => entry.tenantId === this.currentTenantId)
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(this.maxSize * 0.1)); // Remove 10% das mais antigas

      currentTenantEntries.forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  /**
   * Registrar violação de segurança
   */
  private recordSecurityViolation(type: string, details: any): void {
    console.error(`SECURITY VIOLATION: ${type}`, details);
    
    monitoring.recordMetric({
      name: 'cache_security_violation',
      duration: 0,
      timestamp: Date.now(),
      metadata: { type, details, tenantId: this.currentTenantId }
    });
  }

  /**
   * Auditoria de operações de cache
   */
  private async auditCacheOperation(
    operation: string, 
    key: string, 
    sensitivity: DataSensitivity
  ): Promise<void> {
    monitoring.recordMetric({
      name: 'cache_operation',
      duration: 0,
      timestamp: Date.now(),
      metadata: { 
        operation, 
        key: key.substring(0, 50), // Truncar chave para logs
        sensitivity,
        tenantId: this.currentTenantId,
        userId: this.currentUserId
      }
    });
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): CacheStats & { hitRate: number; size: number; securityScore: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    const securityScore = this.stats.securityViolations === 0 ? 100 : 
      Math.max(0, 100 - (this.stats.securityViolations * 10));
    
    return {
      ...this.stats,
      hitRate,
      size: this.cache.size,
      securityScore
    };
  }

  /**
   * Limpar todo o cache (usar com cuidado)
   */
  clear(): void {
    this.cache.clear();
    this.stats = { 
      hits: 0, 
      misses: 0, 
      sets: 0, 
      deletes: 0, 
      securityViolations: 0,
      encryptedEntries: 0 
    };
  }

  /**
   * Limpar apenas dados do tenant atual
   */
  clearTenant(): void {
    const tenantPrefix = `${this.currentTenantId}_`;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tenantId === this.currentTenantId) {
        this.cache.delete(key);
        this.stats.deletes++;
      }
    }
  }
}

// Instância singleton
export const secureCacheManager = new SecureCacheManager();