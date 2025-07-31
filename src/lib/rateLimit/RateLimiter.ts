
import { monitoring } from '@/lib/monitoring';
import { DataSensitivity } from '@/lib/security/DataClassification';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  tenantId: string;
  userId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (context: any) => string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tenantIsolated: boolean;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private configs = new Map<string, RateLimitConfig>();
  private securityViolations = new Map<string, number>();

  configure(name: string, config: RateLimitConfig) {
    this.configs.set(name, config);
  }

  async checkLimit(name: string, context?: any): Promise<{ 
    allowed: boolean; 
    remaining: number; 
    resetTime: number;
    securityScore: number;
  }> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Rate limit configuration not found: ${name}`);
    }

    // Construir chave com isolamento de tenant se configurado
    let key = config.keyGenerator ? config.keyGenerator(context) : name;
    
    if (config.tenantIsolated && context?.tenantId) {
      key = `${context.tenantId}_${key}`;
    }

    const now = Date.now();
    let entry = this.store.get(key);
    
    // Limpar entrada expirada
    if (entry && now > entry.resetTime) {
      entry = undefined;
    }

    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        tenantId: context?.tenantId || 'unknown',
        userId: context?.userId || 'unknown',
        severity: config.severity
      };
      this.store.set(key, entry);
    }

    const allowed = entry.count < config.maxRequests;
    
    if (allowed) {
      entry.count++;
    } else {
      // Incrementar violações de segurança
      const violationKey = `${entry.tenantId}_${entry.userId}`;
      const currentViolations = this.securityViolations.get(violationKey) || 0;
      this.securityViolations.set(violationKey, currentViolations + 1);
      
      // Log detalhado para monitoramento
      monitoring.recordMetric({
        name: 'rate_limit_exceeded',
        duration: 0,
        timestamp: now,
        metadata: { 
          limiter: name, 
          key: key.substring(0, 50), // Truncar para segurança
          count: entry.count, 
          limit: config.maxRequests,
          severity: config.severity,
          tenantId: entry.tenantId,
          userId: entry.userId,
          violations: currentViolations + 1
        }
      });

      // Alertar sobre possível ataque se muitas violações
      if (currentViolations > 10 && config.severity === 'CRITICAL') {
        this.alertSecurityBreach(violationKey, currentViolations);
      }
    }

    const securityScore = this.calculateSecurityScore(entry.tenantId, entry.userId);

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      securityScore
    };
  }

  private calculateSecurityScore(tenantId: string, userId: string): number {
    const violationKey = `${tenantId}_${userId}`;
    const violations = this.securityViolations.get(violationKey) || 0;
    return Math.max(0, 100 - (violations * 5));
  }

  private alertSecurityBreach(violationKey: string, violationCount: number): void {
    console.error(`SECURITY ALERT: Possível ataque detectado para ${violationKey}. Violações: ${violationCount}`);
    
    monitoring.recordMetric({
      name: 'security_breach_alert',
      duration: 0,
      timestamp: Date.now(),
      metadata: { violationKey, violationCount, severity: 'CRITICAL' }
    });
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

// Configurações seguras por sensibilidade de dados
rateLimiter.configure('critical_operations', {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => `${context?.userId || 'anonymous'}_critical`,
  severity: 'CRITICAL',
  tenantIsolated: true
});

rateLimiter.configure('personal_data_access', {
  maxRequests: 50,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => `${context?.userId || 'anonymous'}_personal`,
  severity: 'HIGH',
  tenantIsolated: true
});

rateLimiter.configure('api_calls', {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => context?.userId || 'anonymous',
  severity: 'MEDIUM',
  tenantIsolated: true
});

rateLimiter.configure('search_queries', {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => context?.userId || 'anonymous',
  severity: 'MEDIUM',
  tenantIsolated: true
});

rateLimiter.configure('exports', {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => context?.userId || 'anonymous',
  severity: 'HIGH',
  tenantIsolated: true
});

rateLimiter.configure('public_operations', {
  maxRequests: 200,
  windowMs: 60 * 1000, // 1 minuto
  keyGenerator: (context) => context?.userId || 'anonymous',
  severity: 'LOW',
  tenantIsolated: false
});
