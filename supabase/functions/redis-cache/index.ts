/**
 * Edge Function para Cache Aside com Upstash Redis
 * Data: 19 de Setembro de 2025
 * 
 * Implementa padrão Cache Aside distribuído para suportar 500+ usuários simultâneos
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REDIS_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const REDIS_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('Missing Redis credentials');
}

interface CacheStrategy {
  ttl: number; // seconds
  sensitivity: 'public' | 'business' | 'personal' | 'sensitive';
  invalidation_pattern: string[];
}

const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  'dashboard-stats': {
    ttl: 300, // 5 minutos
    sensitivity: 'business',
    invalidation_pattern: ['sales:*', 'commissions:*', 'clients:*']
  },
  'user-management': {
    ttl: 600, // 10 minutos
    sensitivity: 'personal',
    invalidation_pattern: ['tenant_users:*', 'profiles:*']
  },
  'crm-data': {
    ttl: 180, // 3 minutos
    sensitivity: 'business',
    invalidation_pattern: ['clients:*', 'interactions:*', 'tasks:*']
  },
  'sales-data': {
    ttl: 240, // 4 minutos
    sensitivity: 'business',
    invalidation_pattern: ['sales:*', 'commissions:*']
  },
  'public-data': {
    ttl: 3600, // 1 hora
    sensitivity: 'public',
    invalidation_pattern: []
  }
};

class RedisCache {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = REDIS_URL!;
    this.headers = {
      'Authorization': `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  async get(key: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseUrl}/get/${encodeURIComponent(key)}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        console.error('Redis GET error:', await response.text());
        return null;
      }

      const data = await response.json();
      
      if (data.result === null) {
        return null;
      }

      return JSON.parse(data.result);
    } catch (error) {
      console.error('Redis GET exception:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          value: JSON.stringify(value),
          ex: ttlSeconds
        }),
      });

      if (!response.ok) {
        console.error('Redis SET error:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Redis SET exception:', error);
      return false;
    }
  }

  async del(pattern: string): Promise<number> {
    try {
      // Usar SCAN para encontrar chaves que correspondem ao padrão
      const keysResponse = await fetch(`${this.baseUrl}/keys/${encodeURIComponent(pattern)}`, {
        headers: this.headers,
      });

      if (!keysResponse.ok) {
        console.error('Redis KEYS error:', await keysResponse.text());
        return 0;
      }

      const keysData = await keysResponse.json();
      const keys = keysData.result || [];

      if (keys.length === 0) {
        return 0;
      }

      // Deletar chaves encontradas
      const deletePromises = keys.map((key: string) =>
        fetch(`${this.baseUrl}/del/${encodeURIComponent(key)}`, {
          method: 'DELETE',
          headers: this.headers,
        })
      );

      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.ok).length;
      
      console.log(`Deleted ${successful}/${keys.length} keys for pattern: ${pattern}`);
      return successful;
    } catch (error) {
      console.error('Redis DEL exception:', error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/exists/${encodeURIComponent(key)}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.result === 1;
    } catch (error) {
      console.error('Redis EXISTS exception:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        headers: this.headers,
      });

      if (!response.ok) {
        return { error: 'Failed to get stats' };
      }

      return await response.json();
    } catch (error) {
      console.error('Redis STATS exception:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!REDIS_URL || !REDIS_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: 'Redis not configured',
          message: 'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set'
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const redis = new RedisCache();

    console.log(`Redis Cache Action: ${action}`);

    switch (action) {
      case 'get': {
        const key = url.searchParams.get('key');
        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Key is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const value = await redis.get(key);
        const hit = value !== null;

        return new Response(
          JSON.stringify({ 
            hit, 
            data: value,
            cached_at: hit ? new Date().toISOString() : null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'set': {
        const body = await req.json();
        const { key, data, strategy = 'public-data' } = body;

        if (!key || data === undefined) {
          return new Response(
            JSON.stringify({ error: 'Key and data are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const cacheStrategy = CACHE_STRATEGIES[strategy] || CACHE_STRATEGIES['public-data'];
        
        const success = await redis.set(key, {
          data,
          strategy,
          sensitivity: cacheStrategy.sensitivity,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + cacheStrategy.ttl * 1000).toISOString()
        }, cacheStrategy.ttl);

        console.log(`Cache SET: ${key} (TTL: ${cacheStrategy.ttl}s, Strategy: ${strategy})`);

        return new Response(
          JSON.stringify({ 
            success,
            cached_at: new Date().toISOString(),
            ttl: cacheStrategy.ttl,
            strategy
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'invalidate': {
        const body = await req.json();
        const { pattern, strategy } = body;

        let deletedCount = 0;

        if (pattern) {
          deletedCount = await redis.del(pattern);
        } else if (strategy && CACHE_STRATEGIES[strategy]) {
          const cacheStrategy = CACHE_STRATEGIES[strategy];
          for (const invalidationPattern of cacheStrategy.invalidation_pattern) {
            deletedCount += await redis.del(invalidationPattern);
          }
        }

        console.log(`Cache INVALIDATE: ${pattern || strategy} (${deletedCount} keys deleted)`);

        return new Response(
          JSON.stringify({ 
            success: true,
            deleted_count: deletedCount,
            pattern: pattern || strategy
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exists': {
        const key = url.searchParams.get('key');
        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Key is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const exists = await redis.exists(key);

        return new Response(
          JSON.stringify({ exists }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'stats': {
        const stats = await redis.getStats();

        return new Response(
          JSON.stringify({ 
            redis_stats: stats,
            cache_strategies: CACHE_STRATEGIES,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'health': {
        // Health check - testar conexão com Redis
        const testKey = `health:${Date.now()}`;
        const testValue = { test: true, timestamp: Date.now() };
        
        const setSuccess = await redis.set(testKey, testValue, 10);
        const getValue = setSuccess ? await redis.get(testKey) : null;
        const deleteSuccess = setSuccess ? await redis.del(testKey) : 0;

        const healthy = setSuccess && getValue && getValue.test === true;

        return new Response(
          JSON.stringify({ 
            healthy,
            redis_available: setSuccess,
            read_write_ok: healthy,
            timestamp: new Date().toISOString(),
            test_completed: true
          }),
          { 
            status: healthy ? 200 : 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      default: {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action',
            available_actions: ['get', 'set', 'invalidate', 'exists', 'stats', 'health']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

  } catch (error) {
    console.error('Redis Cache Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});