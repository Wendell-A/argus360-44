/**
 * Hook de Usuários com Cache Aside - Redis
 * Data: 19 de Setembro de 2025
 * 
 * Substitui useUserManagement com cache distribuído Redis
 * Elimina N+1 queries e implementa paginação com cache
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { redisManager } from '@/lib/cache/RedisManager';
import { useMemo } from 'react';

interface CachedUserData {
  id: string;
  email: string;
  role: string;
  active: boolean;
  office_id?: string;
  department_id?: string;
  profile: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    position?: string;
  };
  office: {
    name?: string;
    type?: string;
  };
  department: {
    name?: string;
  };
  position: {
    name?: string;
  };
  permissions: Record<string, any>;
  stats: {
    total_sales: number;
    total_commission: number;
    last_activity?: string;
    active_goals: number;
  };
}

interface UsersListResponse {
  users: CachedUserData[];
  total_count: number;
  cache_info: {
    cached_at: string;
    cache_strategy: string;
    source: 'cache' | 'database';
    page_cached: boolean;
  };
}

export const useCachedUsers = (
  limit: number = 50,
  offset: number = 0,
  enabled: boolean = true
): UseQueryResult<UsersListResponse> => {
  const { user, activeTenant } = useAuth();

  const cacheKey = useMemo(() => {
    if (!user?.id || !activeTenant?.tenant_id) return null;
    return redisManager.generateKey(
      'users-complete',
      user.id,
      activeTenant.tenant_id,
      `limit:${limit}:offset:${offset}`
    );
  }, [user?.id, activeTenant?.tenant_id, limit, offset]);

  return useQuery({
    queryKey: ['cached-users', user?.id, activeTenant?.tenant_id, limit, offset],
    queryFn: async (): Promise<UsersListResponse> => {
      if (!user?.id || !activeTenant?.tenant_id || !cacheKey) {
        throw new Error('Usuário ou tenant não autenticado');
      }

      // Implementar Cache Aside Pattern
      return await redisManager.cacheAside(
        cacheKey,
        async () => {
          console.log(`🔄 Fetching users data from database (limit: ${limit}, offset: ${offset})...`);
          
          // Primeiro, obter contagem total (pode estar em cache separado)
          const countCacheKey = redisManager.generateKey(
            'users-count',
            undefined,
            activeTenant.tenant_id
          );

          const totalCount = await redisManager.cacheAside(
            countCacheKey,
            async () => {
              const { count, error: countError } = await supabase
                .from('tenant_users')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', activeTenant.tenant_id)
                .eq('active', true);

              if (countError) {
                console.error('❌ Count error:', countError);
                throw countError;
              }

              return count || 0;
            },
            'user-management' // Mesmo TTL dos usuários
          );

          // Buscar dados dos usuários
          const { data, error } = await supabase
            .rpc('get_users_complete_optimized', {
              tenant_uuid: activeTenant.tenant_id,
              limit_param: limit,
              offset_param: offset
            });

          if (error) {
            console.error('❌ Users database error:', error);
            throw error;
          }

          // Transformar dados para estrutura esperada
          const users: CachedUserData[] = (data || []).map((row: any) => ({
            id: row.user_id,
            ...row.user_data,
            profile: row.profile_data || {},
            office: row.office_data || {},
            department: row.department_data || {},
            position: row.position_data || {},
            permissions: row.permissions_data || {},
            stats: row.stats_data || {
              total_sales: 0,
              total_commission: 0,
              active_goals: 0
            }
          }));

          const response = {
            users,
            total_count: totalCount
          };

          console.log(`✅ Users data fetched from database (${users.length} users)`);
          return response;
        },
        'user-management' // Cache strategy
      ).then(data => ({
        ...data,
        cache_info: {
          cached_at: new Date().toISOString(),
          cache_strategy: 'user-management',
          source: 'database' as const,
          page_cached: true
        }
      }));
    },
    enabled: Boolean(enabled && user?.id && activeTenant?.tenant_id && cacheKey),
    staleTime: 480000, // 8 minutos (menor que TTL do cache de 10 min)
    gcTime: 900000, // 15 minutos
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook para buscar um usuário específico com cache
 */
export const useCachedUser = (
  userId: string,
  enabled: boolean = true
): UseQueryResult<CachedUserData | null> => {
  const { activeTenant } = useAuth();

  const cacheKey = useMemo(() => {
    if (!userId || !activeTenant?.tenant_id) return null;
    return redisManager.generateKey(
      'user-detail',
      userId,
      activeTenant.tenant_id
    );
  }, [userId, activeTenant?.tenant_id]);

  return useQuery({
    queryKey: ['cached-user-detail', userId, activeTenant?.tenant_id],
    queryFn: async (): Promise<CachedUserData | null> => {
      if (!userId || !activeTenant?.tenant_id || !cacheKey) {
        throw new Error('Parâmetros inválidos');
      }

      return await redisManager.cacheAside(
        cacheKey,
        async () => {
          console.log(`🔄 Fetching user ${userId} from database...`);
          
          const { data, error } = await supabase
            .rpc('get_users_complete_optimized', {
              tenant_uuid: activeTenant.tenant_id,
              limit_param: 1,
              offset_param: 0
            });

          if (error) {
            console.error('❌ User detail database error:', error);
            throw error;
          }

          if (!data || data.length === 0) {
            return null;
          }

          const row = data.find((u: any) => u.user_id === userId);
          if (!row) return null;

          const user: CachedUserData = {
            id: row.user_id,
            ...row.user_data,
            profile: row.profile_data || {},
            office: row.office_data || {},
            department: row.department_data || {},
            position: row.position_data || {},
            permissions: row.permissions_data || {},
            stats: row.stats_data || {
              total_sales: 0,
              total_commission: 0,
              active_goals: 0
            }
          };

          console.log(`✅ User ${userId} data fetched from database`);
          return user;
        },
        'user-management'
      );
    },
    enabled: Boolean(enabled && userId && activeTenant?.tenant_id && cacheKey),
    staleTime: 480000, // 8 minutos
    gcTime: 900000, // 15 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * Hook para invalidar cache de usuários
 */
export const useInvalidateUsersCache = () => {
  const { user, activeTenant } = useAuth();

  return {
    invalidateAllUsers: async () => {
      if (!activeTenant?.tenant_id) return 0;
      
      return await redisManager.invalidateByStrategy('user-management');
    },

    invalidateUsersPagination: async () => {
      if (!activeTenant?.tenant_id) return 0;
      
      // Invalidar todas as páginas de usuários
      const pattern = redisManager.generateKey(
        'users-complete',
        '*',
        activeTenant.tenant_id,
        '*'
      );

      const result = await redisManager.invalidate(pattern);
      return result?.deleted_count || 0;
    },

    invalidateSpecificUser: async (userId: string) => {
      if (!activeTenant?.tenant_id) return 0;
      
      const cacheKey = redisManager.generateKey(
        'user-detail',
        userId,
        activeTenant.tenant_id
      );

      const result = await redisManager.invalidate(cacheKey);
      return result?.deleted_count || 0;
    },

    invalidateUserCount: async () => {
      if (!activeTenant?.tenant_id) return 0;
      
      const countCacheKey = redisManager.generateKey(
        'users-count',
        undefined,
        activeTenant.tenant_id
      );

      const result = await redisManager.invalidate(countCacheKey);
      return result?.deleted_count || 0;
    }
  };
};

/**
 * Hook para pré-carregar páginas de usuários
 */
export const useWarmUsersCache = () => {
  const { user, activeTenant } = useAuth();

  return async (pages: number = 3, pageSize: number = 50) => {
    if (!user?.id || !activeTenant?.tenant_id) return 0;

    const warmupFunctions = [];
    
    // Pré-carregar as primeiras N páginas
    for (let i = 0; i < pages; i++) {
      const offset = i * pageSize;
      const cacheKey = redisManager.generateKey(
        'users-complete',
        user.id,
        activeTenant.tenant_id,
        `limit:${pageSize}:offset:${offset}`
      );

      warmupFunctions.push({
        key: cacheKey,
        fetchFn: async () => {
          const { data } = await supabase
            .rpc('get_users_complete_optimized', {
              tenant_uuid: activeTenant.tenant_id,
              limit_param: pageSize,
              offset_param: offset
            });

          return (data || []).map((row: any) => ({
            id: row.user_id,
            ...row.user_data,
            profile: row.profile_data || {},
            office: row.office_data || {},
            department: row.department_data || {},
            position: row.position_data || {},
            permissions: row.permissions_data || {},
            stats: row.stats_data || {
              total_sales: 0,
              total_commission: 0,
              active_goals: 0
            }
          }));
        },
        strategy: 'user-management'
      });
    }

    return await redisManager.warmCache(warmupFunctions);
  };
};