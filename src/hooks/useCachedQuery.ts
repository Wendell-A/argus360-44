
/**
 * Hook de Query com Cache Seguro - ETAPA 1
 * Data: 29 de Janeiro de 2025, 14:15 UTC
 * 
 * Integração completa com SecureCacheManager, Rate Limiting e 
 * classificação automática de dados por sensibilidade.
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { secureCacheManager } from '@/lib/security/SecureCacheManager';
import { rateLimiter } from '@/lib/rateLimit/RateLimiter';
import { monitoring } from '@/lib/monitoring';
import { DataSensitivity, getMaxSensitivity, containsSensitiveData } from '@/lib/security/DataClassification';
import { useAuth } from '@/contexts/AuthContext';

interface CachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  cacheTime?: number;
  enableLocalCache?: boolean;
  sensitivity?: DataSensitivity;
  rateLimitKey?: string;
  requireAuth?: boolean;
}

export function useCachedQuery<T>(
  queryKey: readonly unknown[],
  options: CachedQueryOptions<T>
): UseQueryResult<T> {
  const { user, activeTenant } = useAuth();
  
  const {
    queryFn,
    cacheTime,
    enableLocalCache = true,
    sensitivity,
    rateLimitKey = 'api_calls',
    requireAuth = true,
    ...queryOptions
  } = options;

  const cacheKey = JSON.stringify(queryKey);

  const enhancedQueryFn = async (): Promise<T> => {
    const timer = monitoring.startTimer('secure_query', { 
      queryKey: cacheKey.substring(0, 50),
      sensitivity: sensitivity || 'auto-detect'
    });

    try {
      // 1. Verificar autenticação se necessário
      if (requireAuth && (!user || !activeTenant)) {
        throw new Error('Usuário não autenticado ou tenant não selecionado');
      }

      // 2. Configurar contexto de segurança no cache manager
      if (user && activeTenant) {
        secureCacheManager.setContext(activeTenant.tenant_id, user.id);
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

        // Log score de segurança se estiver baixo
        if (rateLimitResult.securityScore < 50) {
          console.warn(`Score de segurança baixo para usuário ${user.id}: ${rateLimitResult.securityScore}`);
        }
      }

      // 4. Verificar cache local primeiro
      if (enableLocalCache && user && activeTenant) {
        const cached = await secureCacheManager.get<T>(cacheKey);
        if (cached) {
          monitoring.recordMetric({
            name: 'secure_cache_hit',
            duration: 0,
            timestamp: Date.now(),
            metadata: { 
              hit: true, 
              key: cacheKey.substring(0, 50),
              tenantId: activeTenant.tenant_id,
              userId: user.id
            }
          });
          timer.end();
          return cached;
        }
      }

      // 5. Executar query original
      const result = await queryFn();

      // 6. Auto-detectar sensibilidade se não fornecida
      let finalSensitivity = sensitivity;
      if (!finalSensitivity && result && typeof result === 'object') {
        if (Array.isArray(result)) {
          // Para arrays, verificar o primeiro item
          finalSensitivity = result.length > 0 ? getMaxSensitivity(result[0] as any) : DataSensitivity.PUBLIC;
        } else {
          finalSensitivity = getMaxSensitivity(result as any);
        }
      } else if (!finalSensitivity) {
        finalSensitivity = DataSensitivity.PUBLIC;
      }

      // 7. Armazenar no cache seguro
      if (enableLocalCache && user && activeTenant) {
        await secureCacheManager.set(cacheKey, result, finalSensitivity, cacheTime);
      }

      // 8. Log métricas
      monitoring.recordMetric({
        name: 'secure_cache_miss',
        duration: 0,
        timestamp: Date.now(),
        metadata: { 
          hit: false, 
          key: cacheKey.substring(0, 50),
          sensitivity: finalSensitivity,
          containsSensitive: containsSensitiveData(result as any),
          tenantId: activeTenant?.tenant_id,
          userId: user?.id
        }
      });

      timer.end();
      return result;
    } catch (error) {
      monitoring.recordMetric({
        name: 'secure_query_error',
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

  return useQuery({
    queryKey,
    queryFn: enhancedQueryFn,
    staleTime: cacheTime,
    enabled: !requireAuth || Boolean(user && activeTenant),
    ...queryOptions
  });
}

// Hook para invalidar cache seguro
export const useInvalidateSecureCache = () => {
  const { user, activeTenant } = useAuth();

  const invalidatePattern = async (pattern: string) => {
    if (!user || !activeTenant) {
      console.warn('Não é possível invalidar cache sem contexto de usuário/tenant');
      return 0;
    }

    secureCacheManager.setContext(activeTenant.tenant_id, user.id);
    return secureCacheManager.invalidatePattern(pattern);
  };

  const invalidateKey = async (key: string) => {
    if (!user || !activeTenant) {
      console.warn('Não é possível invalidar cache sem contexto de usuário/tenant');
      return false;
    }

    secureCacheManager.setContext(activeTenant.tenant_id, user.id);
    return secureCacheManager.delete(key);
  };

  const clearTenantCache = () => {
    if (!user || !activeTenant) {
      console.warn('Não é possível limpar cache sem contexto de usuário/tenant');
      return;
    }

    secureCacheManager.setContext(activeTenant.tenant_id, user.id);
    secureCacheManager.clearTenant();
  };

  const getCacheStats = () => {
    return secureCacheManager.getStats();
  };

  return {
    invalidatePattern,
    invalidateKey,
    clearTenantCache,
    getCacheStats
  };
};
