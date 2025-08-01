import { monitoring } from '@/lib/monitoring';

export interface AdvancedMetrics {
  // Cache Performance
  cacheMetrics: {
    hitRate: number;              // Target: 70%+
    missLatency: number;          // Target: <100ms
    evictionRate: number;         // Target: <5%
    memoryUsage: number;          // Target: <100MB
    encryptionOverhead: number;   // Target: <10ms
    tenantIsolationViolations: number; // Target: 0
  };
  
  // Database Performance
  dbMetrics: {
    avgQueryTime: number;         // Target: <200ms
    slowQueries: QueryInfo[];     // Target: 0 queries >1s
    connectionPoolUsage: number;  // Target: <80%
    deadlockCount: number;        // Target: 0
    indexHitRate: number;         // Target: >99%
  };
  
  // Security Metrics
  securityMetrics: {
    authFailures: number;         // Target: <1%
    crossTenantAttempts: number;  // Target: 0
    sensitiveDataExposures: number; // Target: 0
    sqlInjectionAttempts: number; // Target: 0
    encryptionFailures: number;   // Target: 0
  };
  
  // Offline/Sync Metrics
  offlineMetrics: {
    syncSuccessRate: number;      // Target: >98%
    offlineOperationsQueued: number;
    avgSyncTime: number;          // Target: <30s
    dataCorruptions: number;      // Target: 0
    storageUsage: number;         // Target: <50MB
  };
}

export interface QueryInfo {
  query: string;
  duration: number;
  timestamp: number;
  table?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  memoryUsed: number;
  encryptionCount: number;
  avgEncryptionTime: number;
  tenantViolations: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsed: 0,
    encryptionCount: 0,
    avgEncryptionTime: 0,
    tenantViolations: 0
  };
  
  private queryHistory: QueryInfo[] = [];
  private securityEvents: any[] = [];
  private syncMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    totalSyncTime: 0,
    queuedOperations: 0,
    storageUsed: 0
  };

  private constructor() {
    this.startMetricsCollection();
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  async collectMetrics(): Promise<AdvancedMetrics> {
    return {
      cacheMetrics: await this.collectCacheMetrics(),
      dbMetrics: await this.collectDbMetrics(),
      securityMetrics: await this.collectSecurityMetrics(),
      offlineMetrics: await this.collectOfflineMetrics()
    };
  }

  // Cache Metrics
  recordCacheHit(): void {
    this.cacheStats.hits++;
  }

  recordCacheMiss(latency: number): void {
    this.cacheStats.misses++;
    // Store miss latency for calculations
  }

  recordCacheEviction(): void {
    this.cacheStats.evictions++;
  }

  recordEncryption(duration: number): void {
    this.cacheStats.encryptionCount++;
    const totalTime = this.cacheStats.avgEncryptionTime * (this.cacheStats.encryptionCount - 1) + duration;
    this.cacheStats.avgEncryptionTime = totalTime / this.cacheStats.encryptionCount;
  }

  recordTenantViolation(): void {
    this.cacheStats.tenantViolations++;
  }

  private async collectCacheMetrics() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests) * 100 : 0;
    
    return {
      hitRate,
      missLatency: await this.measureCacheMissLatency(),
      evictionRate: totalRequests > 0 ? (this.cacheStats.evictions / totalRequests) * 100 : 0,
      memoryUsage: await this.calculateMemoryUsage(),
      encryptionOverhead: this.cacheStats.avgEncryptionTime,
      tenantIsolationViolations: this.cacheStats.tenantViolations
    };
  }

  // Database Metrics
  recordQuery(query: string, duration: number, table?: string): void {
    this.queryHistory.push({
      query: query.substring(0, 100), // Truncate for storage
      duration,
      timestamp: Date.now(),
      table
    });

    // Keep only last 1000 queries
    if (this.queryHistory.length > 1000) {
      this.queryHistory = this.queryHistory.slice(-1000);
    }
  }

  private async collectDbMetrics() {
    const recentQueries = this.queryHistory.filter(
      q => Date.now() - q.timestamp < 3600000 // Last hour
    );

    const avgQueryTime = recentQueries.length > 0
      ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length
      : 0;

    const slowQueries = recentQueries.filter(q => q.duration > 1000); // >1s

    return {
      avgQueryTime,
      slowQueries,
      connectionPoolUsage: await this.getConnectionPoolUsage(),
      deadlockCount: await this.getDeadlockCount(),
      indexHitRate: await this.getIndexHitRate()
    };
  }

  // Security Metrics
  recordSecurityEvent(type: string, details: any): void {
    this.securityEvents.push({
      type,
      details,
      timestamp: Date.now()
    });

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  private async collectSecurityMetrics() {
    const recentEvents = this.securityEvents.filter(
      e => Date.now() - e.timestamp < 3600000 // Last hour
    );

    return {
      authFailures: recentEvents.filter(e => e.type === 'auth_failure').length,
      crossTenantAttempts: recentEvents.filter(e => e.type === 'cross_tenant_attempt').length,
      sensitiveDataExposures: recentEvents.filter(e => e.type === 'data_exposure').length,
      sqlInjectionAttempts: recentEvents.filter(e => e.type === 'sql_injection').length,
      encryptionFailures: recentEvents.filter(e => e.type === 'encryption_failure').length
    };
  }

  // Offline/Sync Metrics
  recordSyncOperation(success: boolean, duration: number): void {
    this.syncMetrics.totalOperations++;
    if (success) {
      this.syncMetrics.successfulOperations++;
    }
    this.syncMetrics.totalSyncTime += duration;
  }

  recordQueuedOperation(): void {
    this.syncMetrics.queuedOperations++;
  }

  removeQueuedOperation(): void {
    this.syncMetrics.queuedOperations = Math.max(0, this.syncMetrics.queuedOperations - 1);
  }

  private async collectOfflineMetrics() {
    const syncSuccessRate = this.syncMetrics.totalOperations > 0
      ? (this.syncMetrics.successfulOperations / this.syncMetrics.totalOperations) * 100
      : 0;

    const avgSyncTime = this.syncMetrics.successfulOperations > 0
      ? this.syncMetrics.totalSyncTime / this.syncMetrics.successfulOperations
      : 0;

    return {
      syncSuccessRate,
      offlineOperationsQueued: this.syncMetrics.queuedOperations,
      avgSyncTime,
      dataCorruptions: await this.detectDataCorruptions(),
      storageUsage: await this.calculateStorageUsage()
    };
  }

  // Helper Methods
  private async measureCacheMissLatency(): Promise<number> {
    // Simulate cache miss latency measurement
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1));
    return performance.now() - start;
  }

  private async calculateMemoryUsage(): Promise<number> {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return memInfo.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  private async getConnectionPoolUsage(): Promise<number> {
    // This would need to be implemented based on your database connection pool
    return Math.random() * 100; // Placeholder
  }

  private async getDeadlockCount(): Promise<number> {
    // This would query database statistics
    return 0; // Placeholder
  }

  private async getIndexHitRate(): Promise<number> {
    // This would query database index statistics
    return 99.5; // Placeholder
  }

  private async detectDataCorruptions(): Promise<number> {
    // Implement data corruption detection
    return 0; // Placeholder
  }

  private async calculateStorageUsage(): Promise<number> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return (estimate.usage || 0) / (1024 * 1024); // MB
      }
    } catch (error) {
      console.warn('Storage estimation not available');
    }
    return 0;
  }

  private startMetricsCollection(): void {
    // Start collecting system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);
  }

  private async collectSystemMetrics(): Promise<void> {
    // Collect basic system metrics from monitoring service
    const systemMetrics = monitoring.getSystemMetrics();
    
    // Update our internal metrics based on system metrics
    this.updateFromSystemMetrics(systemMetrics);
  }

  private updateFromSystemMetrics(systemMetrics: any): void {
    // Map system metrics to our advanced metrics
    // This bridges the existing monitoring system with our advanced metrics
  }

  // Public API for getting real-time metrics
  getCacheStats(): CacheStats {
    return { ...this.cacheStats };
  }

  getRecentQueries(limit: number = 10): QueryInfo[] {
    return this.queryHistory.slice(-limit);
  }

  getSecurityEvents(limit: number = 10): any[] {
    return this.securityEvents.slice(-limit);
  }

  // Reset methods for testing
  resetMetrics(): void {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsed: 0,
      encryptionCount: 0,
      avgEncryptionTime: 0,
      tenantViolations: 0
    };
    this.queryHistory = [];
    this.securityEvents = [];
    this.syncMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      totalSyncTime: 0,
      queuedOperations: 0,
      storageUsed: 0
    };
  }
}

export const metricsCollector = MetricsCollector.getInstance();
