
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  queryCount: number;
  averageQueryTime: number;
  cacheHitRate: number;
  errorRate: number;
  activeUsers: number;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;

  startTimer(name: string, metadata?: Record<string, any>) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric({
          name,
          duration,
          timestamp: Date.now(),
          metadata
        });
      }
    };
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Manter apenas as métricas mais recentes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log para debug em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[METRIC] ${metric.name}: ${metric.duration.toFixed(2)}ms`);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  getSystemMetrics(): SystemMetrics {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > lastHour);

    const queryMetrics = recentMetrics.filter(m => m.name.includes('query'));
    const cacheMetrics = recentMetrics.filter(m => m.name.includes('cache'));
    const errorMetrics = recentMetrics.filter(m => m.name.includes('error'));

    const cacheHits = cacheMetrics.filter(m => m.metadata?.hit === true).length;
    const cacheTotal = cacheMetrics.length;

    return {
      queryCount: queryMetrics.length,
      averageQueryTime: queryMetrics.length > 0 
        ? queryMetrics.reduce((sum, m) => sum + m.duration, 0) / queryMetrics.length 
        : 0,
      cacheHitRate: cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0,
      errorRate: recentMetrics.length > 0 
        ? (errorMetrics.length / recentMetrics.length) * 100 
        : 0,
      activeUsers: 1 // Simplificado por enquanto
    };
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const monitoring = new MonitoringService();
