/**
 * Hook de Query Otimizada - ETAPA 2
 * Data: 31 de Janeiro de 2025, 03:01 UTC
 * 
 * Hook que integra todos os sistemas de cache e otimização:
 * - Hybrid Cache System (3 camadas)
 * - Request Deduplication
 * - Rate Limiting
 * - Security Monitoring
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { hybridCache, CACHE_STRATEGIES } from '@/lib/cache/HybridCacheSystem';
import { requestDeduplicator } from '@/lib/cache/RequestDeduplicator';
import { rateLimiter } from '@/lib/rateLimit/RateLimiter';
import { monitoring } from '@/lib/monitoring';
import { DataSensitivity, getMaxSensitivity, containsSensitiveData } from '@/lib/security/DataClassification';
import { useAuth } from '@/contexts/AuthContext';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn' | 'queryKey'> {
  queryFn: () => Promise<T>;
  cacheStrategy?: keyof typeof CACHE_STRATEGIES;
  sensitivity?: DataSensitivity;
  enableDeduplication?: boolean;
  enableHybridCache?: boolean;
  rateLimitKey?: string;
  requireAuth?: boolean;
  timeout?: number;
}

export function useOptimizedQuery<T>(
  queryKey: readonly unknown[],
  options: OptimizedQueryOptions<T>
): UseQueryResult<T> {
  const { user, activeTenant } = useAuth();
  
  const {
    queryFn,
    cacheStrategy,
    sensitivity,
    enableDeduplication = true,
    enableHybridCache = true,
    rateLimitKey = 'api_calls',
    requireAuth = true,
    timeout = 10000,
    ...queryOptions
  } = options;

  const cacheKey = JSON.stringify(queryKey);

  const enhancedQueryFn = async (): Promise<T> => {
    const timer = monitoring.startTimer('optimized_query', { 
      queryKey: cacheKey.substring(0, 50),
      strategy: cacheStrategy,
      sensitivity: sensitivity || 'auto-detect'
    });

    try {
      // 1. Verificar autenticação se necessário
      if (requireAuth && (!user || !activeTenant)) {
        throw new Error('Usuário não autenticado ou tenant não selecionado');
      }

      // 2. Configurar contexto de segurança
      if (user && activeTenant) {
        hybridCache.setContext(activeTenant.tenant_id, user.id);
      }

      // 3. Rate limiting baseado na sensibilidade
      if (user && activeTenant) {
        const rateLimitResult = await rateLimiter.checkLimit(rateLimitKey, {
          userId: user.id,
          tenantId: activeTenant.tenant_id
        });

        if (!rateLimitResult.allowed) {
          const resetMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
          throw new Error(`Rate limit excedido. Tente novamente em ${resetMinutes} minuto(s).`);
        }

        // Alertar sobre score de segurança baixo
        if (rateLimitResult.securityScore < 50) {
          console.warn(`Score de segurança baixo para usuário ${user.id}: ${rateLimitResult.securityScore}`);
        }
      }

      // 4. Determinar sensibilidade dos dados
      let finalSensitivity = sensitivity;
      if (!finalSensitivity && cacheStrategy) {
        finalSensitivity = CACHE_STRATEGIES[cacheStrategy].sensitivity;
      }
      finalSensitivity = finalSensitivity || DataSensitivity.PUBLIC;

      // 5. Verificar cache híbrido primeiro
      if (enableHybridCache && user && activeTenant) {
        const cached = await hybridCache.get<T>(cacheKey, finalSensitivity);
        if (cached) {
          monitoring.recordMetric({
            name: 'optimized_cache_hit',
            duration: 0,
            timestamp: Date.now(),
            metadata: { 
              hit: true, 
              key: cacheKey.substring(0, 50),
              sensitivity: finalSensitivity,
              tenantId: activeTenant.tenant_id,
              userId: user.id
            }
          });
          timer.end();
          return cached;
        }
      }

      // 6. Executar query com deduplicação
      const executeQuery = async (): Promise<T> => {
        const result = await (timeout > 0 
          ? Promise.race([
              queryFn(),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Query timeout')), timeout)
              )
            ])
          : queryFn()
        );

        // Auto-detectar sensibilidade se não fornecida
        if (!sensitivity && result && typeof result === 'object') {
          if (Array.isArray(result)) {
            finalSensitivity = result.length > 0 ? getMaxSensitivity(result[0] as any) : DataSensitivity.PUBLIC;
          } else {
            finalSensitivity = getMaxSensitivity(result as any);
          }
        }

        // Armazenar no cache híbrido
        if (enableHybridCache && user && activeTenant) {
          const ttl = cacheStrategy ? CACHE_STRATEGIES[cacheStrategy].ttl : undefined;
          await hybridCache.set(cacheKey, result, finalSensitivity!, ttl);
        }

        return result;
      };

      const result = enableDeduplication 
        ? await requestDeduplicator.deduplicateWithTimeout(cacheKey, executeQuery, timeout)
        : await executeQuery();

      // 7. Log métricas de sucesso
      monitoring.recordMetric({
        name: 'optimized_query_success',
        duration: 0,
        timestamp: Date.now(),
        metadata: { 
          key: cacheKey.substring(0, 50),
          sensitivity: finalSensitivity,
          containsSensitive: containsSensitiveData(result as any),
          deduplication: enableDeduplication,
          hybridCache: enableHybridCache,
          tenantId: activeTenant?.tenant_id,
          userId: user?.id
        }
      });

      timer.end();
      return result;
    } catch (error) {
      monitoring.recordMetric({
        name: 'optimized_query_error',
        duration: 0,
        timestamp: Date.now(),
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error', 
          key: cacheKey.substring(0, 50),
          tenantId: activeTenant?.tenant_id,
          userId: user?.id
        }
      });
      timer.end();
      throw error;
    }
  };

  // Determinar configurações de cache para React Query
  const reactQueryConfig = cacheStrategy ? {
    staleTime: CACHE_STRATEGIES[cacheStrategy].ttl,
    gcTime: CACHE_STRATEGIES[cacheStrategy].ttl * 2, // Manter em cache 2x o TTL
  } : {};

  return useQuery({
    queryKey,
    queryFn: enhancedQueryFn,
    enabled: !requireAuth || Boolean(user && activeTenant),
    ...reactQueryConfig,
    ...queryOptions
  });
}

// Hook para invalidar cache otimizado
export const useInvalidateOptimizedCache = () => {
  const { user, activeTenant } = useAuth();

  const invalidatePattern = async (pattern: string) => {
    if (!user || !activeTenant) {
      console.warn('Não é possível invalidar cache sem contexto de usuário/tenant');
      return 0;
    }

    hybridCache.setContext(activeTenant.tenant_id, user.id);
    return hybridCache.invalidatePattern(pattern);
  };

  const invalidateStrategy = async (strategy: keyof typeof CACHE_STRATEGIES) => {
    if (!user || !activeTenant) {
      console.warn('Não é possível invalidar cache sem contexto de usuário/tenant');
      return 0;
    }

    // Invalidar baseado nos eventos da estratégia
    const strategyConfig = CACHE_STRATEGIES[strategy];
    let invalidated = 0;

    for (const event of strategyConfig.invalidateOn) {
      invalidated += await invalidatePattern(event);
    }

    return invalidated;
  };

  const clearTenantCache = () => {
    if (!user || !activeTenant) {
      console.warn('Não é possível limpar cache sem contexto de usuário/tenant');
      return;
    }

    hybridCache.setContext(activeTenant.tenant_id, user.id);
    hybridCache.clear();
  };

  const getOptimizedCacheStats = () => {
    const hybridStats = hybridCache.getMetrics();
    const deduplicationStats = requestDeduplicator.getMetrics();

    return {
      hybrid: hybridStats,
      deduplication: deduplicationStats,
      combined: {
        totalHitRate: hybridStats.hitRate,
        deduplicationRate: deduplicationStats.deduplicationRate,
        activeRequests: deduplicationStats.activeRequests,
        cacheSize: hybridStats.size
      }
    };
  };

  return {
    invalidatePattern,
    invalidateStrategy,
    clearTenantCache,
    getOptimizedCacheStats
  };
};

// Hooks específicos para diferentes tipos de dados
export const useOptimizedUserQuery = <T>(
  queryKey: readonly unknown[],
  options: { queryFn: () => Promise<T> } & Partial<OptimizedQueryOptions<T>>
) => {
  return useOptimizedQuery(queryKey, {
    cacheStrategy: 'user-profile',
    sensitivity: DataSensitivity.PERSONAL,
    rateLimitKey: 'personal_data_access',
    ...options
  });
};

export const useOptimizedBusinessQuery = <T>(
  queryKey: readonly unknown[],
  options: { queryFn: () => Promise<T> } & Partial<OptimizedQueryOptions<T>>
) => {
  return useOptimizedQuery(queryKey, {
    cacheStrategy: 'commission-data',
    sensitivity: DataSensitivity.BUSINESS,
    rateLimitKey: 'api_calls',
    ...options
  });
};

export const useOptimizedPublicQuery = <T>(
  queryKey: readonly unknown[],
  options: { queryFn: () => Promise<T> } & Partial<OptimizedQueryOptions<T>>
) => {
  return useOptimizedQuery(queryKey, {
    cacheStrategy: 'office-list',
    sensitivity: DataSensitivity.PUBLIC,
    rateLimitKey: 'public_operations',
    ...options
  });
};