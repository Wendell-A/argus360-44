
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { cacheManager } from '@/lib/cache/CacheManager';
import { monitoring } from '@/lib/monitoring';

interface CachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  cacheTime?: number;
  enableLocalCache?: boolean;
}

export function useCachedQuery<T>(
  queryKey: readonly unknown[],
  options: CachedQueryOptions<T>
): UseQueryResult<T> {
  const {
    queryFn,
    cacheTime = 5 * 60 * 1000, // 5 minutos
    enableLocalCache = true,
    ...queryOptions
  } = options;

  const cacheKey = JSON.stringify(queryKey);

  const enhancedQueryFn = async (): Promise<T> => {
    const timer = monitoring.startTimer('query', { queryKey: cacheKey });

    try {
      // Verificar cache local primeiro
      if (enableLocalCache) {
        const cached = cacheManager.get<T>(cacheKey);
        if (cached) {
          monitoring.recordMetric({
            name: 'cache_hit',
            duration: 0,
            timestamp: Date.now(),
            metadata: { hit: true, key: cacheKey }
          });
          timer.end();
          return cached;
        }
      }

      // Executar query original
      const result = await queryFn();

      // Armazenar no cache local
      if (enableLocalCache) {
        cacheManager.set(cacheKey, result, cacheTime);
      }

      monitoring.recordMetric({
        name: 'cache_miss',
        duration: 0,
        timestamp: Date.now(),
        metadata: { hit: false, key: cacheKey }
      });

      timer.end();
      return result;
    } catch (error) {
      monitoring.recordMetric({
        name: 'query_error',
        duration: 0,
        timestamp: Date.now(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error', key: cacheKey }
      });
      timer.end();
      throw error;
    }
  };

  return useQuery({
    queryKey,
    queryFn: enhancedQueryFn,
    staleTime: cacheTime,
    ...queryOptions
  });
}

// Hook para invalidar cache
export const useInvalidateCache = () => {
  const invalidatePattern = (pattern: string) => {
    return cacheManager.invalidatePattern(pattern);
  };

  const invalidateKey = (key: string) => {
    return cacheManager.delete(key);
  };

  const clearCache = () => {
    cacheManager.clear();
  };

  return {
    invalidatePattern,
    invalidateKey,
    clearCache
  };
};
