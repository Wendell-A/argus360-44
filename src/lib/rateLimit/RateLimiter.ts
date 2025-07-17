
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (context: any) => string;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private configs = new Map<string, RateLimitConfig>();

  configure(name: string, config: RateLimitConfig) {
    this.configs.set(name, config);
  }

  async checkLimit(name: string, context?: any): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Rate limit configuration not found: ${name}`);
    }

    const key = config.keyGenerator ? config.keyGenerator(context) : name;
    const now = Date.now();
    
    let entry = this.store.get(key);
    
    // Limpar entrada expirada
    if (entry && now > entry.resetTime) {
      entry = undefined;
    }

    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
      this.store.set(key, entry);
    }

    const allowed = entry.count < config.maxRequests;
    
    if (allowed) {
      entry.count++;
    }

    // Log para monitoramento
    if (!allowed) {
      monitoring.recordMetric({
        name: 'rate_limit_exceeded',
        duration: 0,
        timestamp: now,
        metadata: { limiter: name, key, count: entry.count, limit: config.maxRequests }
      });
    }

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  // Limpeza periódica
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Configurações padrão
rateLimiter.configure('api_calls', {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => context?.userId || 'anonymous'
});

rateLimiter.configure('search_queries', {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => context?.userId || 'anonymous'
});

rateLimiter.configure('exports', {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => context?.userId || 'anonymous'
});
