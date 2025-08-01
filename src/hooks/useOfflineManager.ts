/**
 * Hook de Integração Offline - ETAPA 3 Finalizada
 * Data: 01 de Agosto de 2025, 18:50 UTC
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OfflineDatabase } from '@/lib/offline/OfflineDatabase';
import { BackgroundSyncManager, SyncResult } from '@/lib/offline/BackgroundSyncManager';

let offlineDB: OfflineDatabase | null = null;
let syncManager: BackgroundSyncManager | null = null;

export const useOfflineManager = () => {
  const { user, activeTenant } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncResult | null>(null);

  useEffect(() => {
    if (user && activeTenant && !isInitialized) {
      initializeOfflineSystem();
    }
  }, [user, activeTenant, isInitialized]);

  const initializeOfflineSystem = async () => {
    try {
      offlineDB = new OfflineDatabase();
      await offlineDB.initialize(activeTenant!.tenant_id, user!.id);
      
      syncManager = new BackgroundSyncManager(offlineDB);
      syncManager.onSyncComplete((result) => setSyncStats(result));
      
      setIsInitialized(true);
      console.log('[OfflineManager] Sistema offline inicializado');
    } catch (error) {
      console.error('[OfflineManager] Erro na inicialização:', error);
    }
  };

  return {
    isInitialized,
    syncStats,
    scheduleOperation: (op: any) => syncManager?.scheduleOperation(op),
    forceSync: () => syncManager?.forceSync(),
    getSyncStats: () => syncManager?.getSyncStats()
  };
};