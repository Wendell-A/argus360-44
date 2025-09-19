/**
 * Redis Cache Manager - Client Side
 * Data: 19 de Setembro de 2025
 * 
 * Gerencia comunicação com Edge Function Redis para implementar Cache Aside
 */

import { supabase } from '@/integrations/supabase/client';

interface CacheResult<T> {
  hit: boolean;
  data: T | null;
  cached_at?: string;
  strategy?: string;
  sensitivity?: string;
}

interface CacheSetResult {
  success: boolean;
  cached_at: string;
  ttl: number;
  strategy: string;
}

interface CacheInvalidateResult {
  success: boolean;
  deleted_count: number;
  pattern: string;
}

interface CacheStats {
  redis_stats: any;
  cache_strategies: Record<string, any>;
  timestamp: string;
}

interface HealthStatus {
  healthy: boolean;
  redis_available: boolean;
  read_write_ok: boolean;
  timestamp: string;
}

export class RedisManager {
  private static instance: RedisManager;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `https://ipmdzigjpthmaeyhejdl.supabase.co/functions/v1/redis-cache`;
  }

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private async callRedisFunction(action: string, data?: any): Promise<any> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set('action', action);

      const options: RequestInit = {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbWR6aWdqcHRobWFleWhlamRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTc0MDAsImV4cCI6MjA2ODA5MzQwMH0.R9BH-tYAmETrEVpNiqomvjr6qhUypZdRR2YyBK-haEo`,
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        console.error(`Redis ${action} failed:`, response.status, await response.text());
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Redis ${action} error:`, error);
      return null;
    }
  }

  /**
   * Cache Aside Pattern - GET
   */
  async get<T>(key: string): Promise<CacheResult<T>> {
    const result = await this.callRedisFunction('get', null);
    
    if (!result) {
      return { hit: false, data: null };
    }

    return {
      hit: result.hit,
      data: result.hit ? result.data?.data : null,
      cached_at: result.cached_at,
      strategy: result.data?.strategy,
      sensitivity: result.data?.sensitivity
    };
  }

  /**
   * Cache Aside Pattern - SET
   */
  async set<T>(key: string, data: T, strategy: string = 'public-data'): Promise<CacheSetResult | null> {
    return await this.callRedisFunction('set', { key, data, strategy });
  }

  /**
   * Invalidação de cache por padrão ou estratégia
   */
  async invalidate(pattern?: string, strategy?: string): Promise<CacheInvalidateResult | null> {
    return await this.callRedisFunction('invalidate', { pattern, strategy });
  }

  /**
   * Verificar se uma chave existe no cache
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.callRedisFunction('exists');
    return result?.exists || false;
  }

  /**
   * Obter estatísticas do cache
   */
  async getStats(): Promise<CacheStats | null> {
    return await this.callRedisFunction('stats');
  }

  /**
   * Health check do Redis
   */
  async health(): Promise<HealthStatus | null> {
    return await this.callRedisFunction('health');
  }

  /**
   * Gerar chave de cache contextual baseada no usuário e tenant
   */
  generateKey(prefix: string, userId?: string, tenantId?: string, additional?: string): string {
    const parts = [prefix];
    
    if (tenantId) parts.push(`tenant:${tenantId}`);
    if (userId) parts.push(`user:${userId}`);
    if (additional) parts.push(additional);
    
    return parts.join(':');
  }

  /**
   * Wrapper para implementar Cache Aside Pattern completo
   */
  async cacheAside<T>(
    key: string,
    fetchFn: () => Promise<T>,
    strategy: string = 'public-data',
    maxRetries: number = 2
  ): Promise<T> {
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        // Tentativa 1: Buscar no cache
        const cacheResult = await this.get<T>(key);
        
        if (cacheResult.hit && cacheResult.data !== null) {
          console.log(`🎯 Cache HIT: ${key} (${cacheResult.strategy})`);
          return cacheResult.data;
        }

        // Cache MISS: Buscar dados originais
        console.log(`💥 Cache MISS: ${key} - Fetching from source`);
        const data = await fetchFn();

        // Armazenar no cache para próximas consultas
        if (data !== null && data !== undefined) {
          const setCacheResult = await this.set(key, data, strategy);
          if (setCacheResult?.success) {
            console.log(`💾 Cached: ${key} (TTL: ${setCacheResult.ttl}s)`);
          }
        }

        return data;
        
      } catch (error) {
        console.error(`Cache Aside error (attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount > maxRetries) {
          // Fallback: executar função original sem cache
          console.log(`🚨 Cache fallback for: ${key}`);
          return await fetchFn();
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }
    }

    // Não deveria chegar aqui, mas por segurança
    return await fetchFn();
  }

  /**
   * Invalidar cache por contexto (usuário ou tenant)
   */
  async invalidateByContext(userId?: string, tenantId?: string): Promise<number> {
    let totalDeleted = 0;

    if (tenantId) {
      const tenantResult = await this.invalidate(`*tenant:${tenantId}*`);
      if (tenantResult) totalDeleted += tenantResult.deleted_count;
    }

    if (userId) {
      const userResult = await this.invalidate(`*user:${userId}*`);
      if (userResult) totalDeleted += userResult.deleted_count;
    }

    console.log(`🗑️ Invalidated ${totalDeleted} cache entries for context`);
    return totalDeleted;
  }

  /**
   * Invalidar cache por estratégia
   */
  async invalidateByStrategy(strategy: string): Promise<number> {
    const result = await this.invalidate(undefined, strategy);
    const deleted = result?.deleted_count || 0;
    
    console.log(`🗑️ Invalidated ${deleted} cache entries for strategy: ${strategy}`);
    return deleted;
  }

  /**
   * Pré-aquecer cache com dados importantes
   */
  async warmCache(
    warmupFunctions: Array<{
      key: string;
      fetchFn: () => Promise<any>;
      strategy: string;
    }>
  ): Promise<number> {
    let warmedCount = 0;

    const promises = warmupFunctions.map(async ({ key, fetchFn, strategy }) => {
      try {
        const exists = await this.exists(key);
        if (!exists) {
          const data = await fetchFn();
          const result = await this.set(key, data, strategy);
          if (result?.success) {
            warmedCount++;
            console.log(`🔥 Warmed cache: ${key}`);
          }
        }
      } catch (error) {
        console.error(`Failed to warm cache for ${key}:`, error);
      }
    });

    await Promise.all(promises);
    console.log(`🔥 Cache warming completed: ${warmedCount} keys warmed`);
    
    return warmedCount;
  }
}

// Singleton export
export const redisManager = RedisManager.getInstance();