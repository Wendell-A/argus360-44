/**
 * Request Deduplication System - ETAPA 2
 * Data: 31 de Janeiro de 2025, 03:00 UTC
 * 
 * Sistema para eliminar requisições duplicadas em paralelo,
 * evitando sobrecarga desnecessária no banco de dados.
 */

import { monitoring } from '@/lib/monitoring';

interface PendingRequest<T = any> {
  promise: Promise<T>;
  timestamp: number;
  requestCount: number;
  key: string;
}

interface DeduplicationMetrics {
  totalRequests: number;
  deduplicatedRequests: number;
  activeRequests: number;
  averageWaitTime: number;
}

export class RequestDeduplicator {
  private activeRequests = new Map<string, PendingRequest>();
  private metrics: DeduplicationMetrics;
  private maxAge: number = 30000; // 30 segundos máximo para um request ativo

  constructor() {
    this.metrics = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      activeRequests: 0,
      averageWaitTime: 0
    };
    
    this.setupCleanupScheduler();
  }

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const cleanKey = this.sanitizeKey(key);
    this.metrics.totalRequests++;

    const timer = monitoring.startTimer('request_deduplication', { 
      key: cleanKey.substring(0, 50)
    });

    // Se já existe request ativo para essa chave, retorna a Promise existente
    if (this.activeRequests.has(cleanKey)) {
      const existing = this.activeRequests.get(cleanKey)!;
      
      // Verificar se não é muito antigo
      if (Date.now() - existing.timestamp < this.maxAge) {
        existing.requestCount++;
        this.metrics.deduplicatedRequests++;
        
        monitoring.recordMetric({
          name: 'request_deduplicated',
          duration: 0,
          timestamp: Date.now(),
          metadata: { 
            key: cleanKey.substring(0, 50),
            requestCount: existing.requestCount,
            age: Date.now() - existing.timestamp
          }
        });

        console.log(`🔄 Request deduplicated: ${cleanKey} (${existing.requestCount} requests)`);
        
        const result = await existing.promise;
        timer.end();
        return result;
      } else {
        // Request muito antigo, remover e criar novo
        this.activeRequests.delete(cleanKey);
      }
    }

    // Cria novo request
    const startTime = Date.now();
    const requestPromise = requestFn()
      .then((result) => {
        // Sucesso - remover da lista
        const duration = Date.now() - startTime;
        this.updateAverageWaitTime(duration);
        
        monitoring.recordMetric({
          name: 'request_completed',
          duration,
          timestamp: Date.now(),
          metadata: { 
            key: cleanKey.substring(0, 50),
            success: true
          }
        });

        return result;
      })
      .catch((error) => {
        // Erro - também remover da lista
        const duration = Date.now() - startTime;
        
        monitoring.recordMetric({
          name: 'request_failed',
          duration,
          timestamp: Date.now(),
          metadata: { 
            key: cleanKey.substring(0, 50),
            error: error.message || 'Unknown error'
          }
        });

        throw error;
      })
      .finally(() => {
        // Remove da lista quando completa (sucesso ou erro)
        this.activeRequests.delete(cleanKey);
        this.metrics.activeRequests = this.activeRequests.size;
      });

    // Adicionar à lista de requests ativos
    const pendingRequest: PendingRequest = {
      promise: requestPromise,
      timestamp: Date.now(),
      requestCount: 1,
      key: cleanKey
    };

    this.activeRequests.set(cleanKey, pendingRequest);
    this.metrics.activeRequests = this.activeRequests.size;

    timer.end();
    return requestPromise;
  }

  async deduplicateWithTimeout<T>(
    key: string, 
    requestFn: () => Promise<T>, 
    timeout: number = 10000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout: ${key}`)), timeout);
    });

    return Promise.race([
      this.deduplicate(key, requestFn),
      timeoutPromise
    ]);
  }

  private sanitizeKey(key: string): string {
    // Remover dados sensíveis da chave para logs
    return key
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '[UUID]')
      .replace(/\d{11}/g, '[CPF]')
      .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
  }

  private updateAverageWaitTime(duration: number): void {
    const currentAvg = this.metrics.averageWaitTime;
    const totalCompleted = this.metrics.totalRequests - this.metrics.activeRequests;
    
    if (totalCompleted === 1) {
      this.metrics.averageWaitTime = duration;
    } else {
      this.metrics.averageWaitTime = ((currentAvg * (totalCompleted - 1)) + duration) / totalCompleted;
    }
  }

  private setupCleanupScheduler(): void {
    // Limpeza a cada 1 minuto
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, request] of this.activeRequests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        this.activeRequests.delete(key);
        cleaned++;
        
        console.warn(`🧹 Cleaned stale request: ${key}`);
      }
    }

    if (cleaned > 0) {
      this.metrics.activeRequests = this.activeRequests.size;
      
      monitoring.recordMetric({
        name: 'deduplicator_cleanup',
        duration: 0,
        timestamp: Date.now(),
        metadata: { 
          cleanedRequests: cleaned,
          activeRequests: this.metrics.activeRequests
        }
      });
    }
  }

  getMetrics(): DeduplicationMetrics & { deduplicationRate: number } {
    const deduplicationRate = this.metrics.totalRequests > 0 ? 
      (this.metrics.deduplicatedRequests / this.metrics.totalRequests) * 100 : 0;

    return {
      ...this.metrics,
      deduplicationRate
    };
  }

  clear(): void {
    this.activeRequests.clear();
    this.metrics = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      activeRequests: 0,
      averageWaitTime: 0
    };
  }

  // Força limpeza de um request específico (para testes ou casos especiais)
  forceCleanup(key: string): boolean {
    const cleanKey = this.sanitizeKey(key);
    const existed = this.activeRequests.has(cleanKey);
    
    if (existed) {
      this.activeRequests.delete(cleanKey);
      this.metrics.activeRequests = this.activeRequests.size;
    }
    
    return existed;
  }

  // Obtém informações sobre requests ativos
  getActiveRequests(): Array<{ key: string; age: number; requestCount: number }> {
    const now = Date.now();
    
    return Array.from(this.activeRequests.entries()).map(([key, request]) => ({
      key: key.substring(0, 50),
      age: now - request.timestamp,
      requestCount: request.requestCount
    }));
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();