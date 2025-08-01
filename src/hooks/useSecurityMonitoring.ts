import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { metricsCollector, AdvancedMetrics } from '@/lib/monitoring/MetricsCollector';
import { realTimeAlerting, Alert } from '@/lib/monitoring/RealTimeAlerting';
import { securityMonitor } from '@/lib/monitoring/SecurityMonitor';

export interface SecurityMetrics {
  alerts: Alert[];
  metrics: AdvancedMetrics;
  securityScore: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const useSecurityMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Start/stop monitoring
  useEffect(() => {
    if (isMonitoring) {
      realTimeAlerting.start();
    } else {
      realTimeAlerting.stop();
    }

    return () => {
      realTimeAlerting.stop();
    };
  }, [isMonitoring]);

  // Listen for dashboard alerts
  useEffect(() => {
    const handleDashboardAlert = (event: CustomEvent) => {
      const alert = event.detail as Alert;
      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    };

    window.addEventListener('dashboard-alert', handleDashboardAlert as EventListener);
    
    return () => {
      window.removeEventListener('dashboard-alert', handleDashboardAlert as EventListener);
    };
  }, []);

  // Fetch metrics every 30 seconds
  const { 
    data: metrics, 
    isLoading: isLoadingMetrics,
    error: metricsError,
    refetch: refetchMetrics 
  } = useQuery({
    queryKey: ['security-metrics'],
    queryFn: async () => {
      return await metricsCollector.collectMetrics();
    },
    refetchInterval: 30000, // 30 seconds
    enabled: isMonitoring
  });

  // Calculate security score based on metrics
  const calculateSecurityScore = (metrics: AdvancedMetrics): number => {
    if (!metrics) return 0;

    let score = 100;
    
    // Deduct points for security issues
    score -= metrics.securityMetrics.crossTenantAttempts * 20; // -20 per violation
    score -= metrics.securityMetrics.sensitiveDataExposures * 30; // -30 per exposure
    score -= metrics.securityMetrics.sqlInjectionAttempts * 25; // -25 per attempt
    score -= metrics.securityMetrics.authFailures * 2; // -2 per auth failure
    score -= metrics.securityMetrics.encryptionFailures * 15; // -15 per encryption failure
    
    // Deduct points for cache violations
    score -= metrics.cacheMetrics.tenantIsolationViolations * 25;
    
    // Deduct points for performance issues that could indicate attacks
    if (metrics.dbMetrics.avgQueryTime > 1000) score -= 10; // Possible DoS
    if (metrics.cacheMetrics.hitRate < 30) score -= 5; // Cache poisoning?
    
    return Math.max(0, Math.min(100, score));
  };

  // Determine threat level based on score and active alerts
  const calculateThreatLevel = (score: number, activeAlerts: Alert[]): SecurityMetrics['threatLevel'] => {
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
    const highAlerts = activeAlerts.filter(a => a.severity === 'HIGH').length;
    
    if (criticalAlerts > 0 || score < 50) return 'CRITICAL';
    if (highAlerts > 0 || score < 70) return 'HIGH';
    if (score < 85) return 'MEDIUM';
    return 'LOW';
  };

  // Get active alerts
  const getActiveAlerts = () => {
    return realTimeAlerting.getActiveAlerts();
  };

  // Get alert history
  const getAlertHistory = (limit: number = 50) => {
    return realTimeAlerting.getAlertHistory(limit);
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    await realTimeAlerting.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    await realTimeAlerting.resolveAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  // Get comprehensive security data
  const securityData: SecurityMetrics | null = metrics ? {
    alerts: getActiveAlerts(),
    metrics,
    securityScore: calculateSecurityScore(metrics),
    threatLevel: calculateThreatLevel(calculateSecurityScore(metrics), getActiveAlerts())
  } : null;

  return {
    // Data
    securityData,
    alerts,
    isMonitoring,
    isLoadingMetrics,
    metricsError,
    
    // Methods
    startMonitoring,
    stopMonitoring,
    acknowledgeAlert,
    resolveAlert,
    getActiveAlerts,
    getAlertHistory,
    refetchMetrics,
    
    // Security monitor methods
    auditDataAccess: securityMonitor.auditSensitiveDataAccess.bind(securityMonitor),
    detectTenantBleeding: securityMonitor.detectTenantBleeding.bind(securityMonitor),
    detectSqlInjection: securityMonitor.detectSqlInjection.bind(securityMonitor),
    logFailedLogin: securityMonitor.logFailedLogin.bind(securityMonitor),
    
    // Metrics methods
    recordCacheHit: metricsCollector.recordCacheHit.bind(metricsCollector),
    recordCacheMiss: metricsCollector.recordCacheMiss.bind(metricsCollector),
    recordQuery: metricsCollector.recordQuery.bind(metricsCollector),
    recordSecurityEvent: metricsCollector.recordSecurityEvent.bind(metricsCollector),
    recordSyncOperation: metricsCollector.recordSyncOperation.bind(metricsCollector)
  };
};

// Specialized hook for real-time alerts only
export const useRealTimeAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const handleDashboardAlert = (event: CustomEvent) => {
      const alert = event.detail as Alert;
      setAlerts(prev => {
        // Avoid duplicates
        if (prev.some(a => a.id === alert.id)) return prev;
        return [alert, ...prev.slice(0, 4)]; // Keep last 5 alerts
      });
    };

    window.addEventListener('dashboard-alert', handleDashboardAlert as EventListener);
    
    return () => {
      window.removeEventListener('dashboard-alert', handleDashboardAlert as EventListener);
    };
  }, []);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts,
    dismissAlert,
    clearAllAlerts
  };
};

// Hook for performance monitoring
export const usePerformanceMetrics = () => {
  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const allMetrics = await metricsCollector.collectMetrics();
      return {
        cache: allMetrics.cacheMetrics,
        database: allMetrics.dbMetrics,
        offline: allMetrics.offlineMetrics
      };
    },
    refetchInterval: 60000 // 1 minute
  });

  return {
    metrics,
    isLoading,
    error,
    refetch,
    // Utility methods
    getCacheStats: metricsCollector.getCacheStats.bind(metricsCollector),
    getRecentQueries: metricsCollector.getRecentQueries.bind(metricsCollector)
  };
};