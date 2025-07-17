
import { useEffect, useState } from 'react';
import { monitoring, SystemMetrics } from '@/lib/monitoring';

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    queryCount: 0,
    averageQueryTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    activeUsers: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(monitoring.getSystemMetrics());
    };

    // Atualizar métricas a cada 30 segundos
    const interval = setInterval(updateMetrics, 30000);
    updateMetrics(); // Primeira execução

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

export const useTimer = (name: string, metadata?: Record<string, any>) => {
  useEffect(() => {
    const timer = monitoring.startTimer(name, metadata);
    return () => timer.end();
  }, [name, metadata]);
};
