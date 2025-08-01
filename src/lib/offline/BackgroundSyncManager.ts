/**
 * Background Sync Manager - Sincronização Inteligente ETAPA 3
 * Data: 01 de Agosto de 2025, 18:45 UTC
 * 
 * Gerencia sincronização automática e resiliente com backoff exponencial
 */

import { supabase } from '@/integrations/supabase/client';
import { OfflineDatabase, PendingOperation } from './OfflineDatabase';
import { DataSensitivity } from '@/lib/security/DataClassification';

export interface SyncResult {
  success: number;
  failed: number;
  pending: number;
  errors: Array<{
    operation: PendingOperation;
    error: string;
  }>;
}

export interface SyncConfiguration {
  maxRetries: number;
  batchSize: number;
  retryDelays: number[];
  conflictResolution: 'client' | 'server' | 'manual';
  priorityOrder: Array<'HIGH' | 'MEDIUM' | 'LOW'>;
}

export class BackgroundSyncManager {
  private syncQueue: PendingOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private offlineDB: OfflineDatabase;
  private syncConfig: SyncConfiguration;
  private listeners: Set<(result: SyncResult) => void> = new Set();

  constructor(offlineDB: OfflineDatabase, config?: Partial<SyncConfiguration>) {
    this.offlineDB = offlineDB;
    this.syncConfig = {
      maxRetries: 5,
      batchSize: 10,
      retryDelays: [1000, 5000, 15000, 60000, 300000], // 1s, 5s, 15s, 1m, 5m
      conflictResolution: 'server',
      priorityOrder: ['HIGH', 'MEDIUM', 'LOW'],
      ...config
    };

    this.setupConnectivityListeners();
    this.setupPeriodicSync();
    this.loadQueueFromStorage();
  }

  private setupConnectivityListeners(): void {
    window.addEventListener('online', () => {
      console.log('[SyncManager] Connection restored');
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      console.log('[SyncManager] Connection lost');
      this.isOnline = false;
    });

    // Verificar conectividade real (não apenas navigator.onLine)
    setInterval(() => {
      this.checkRealConnectivity();
    }, 30000); // A cada 30 segundos
  }

  private setupPeriodicSync(): void {
    // Sync a cada 2 minutos quando online
    setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.triggerSync();
      }
    }, 120000);
  }

  private async checkRealConnectivity(): Promise<void> {
    if (!navigator.onLine) {
      this.isOnline = false;
      return;
    }

    try {
      // Tentar fazer request pequeno para verificar conectividade real
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
    }
  }

  async scheduleOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const fullOperation: PendingOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    };

    if (this.isOnline && !this.isSyncing) {
      try {
        // Tentar executar imediatamente se online
        await this.executeOperation(fullOperation);
        this.notifyOperationSuccess(fullOperation);
        return fullOperation.id;
      } catch (error) {
        console.warn('[SyncManager] Operação online falhou, adicionando à queue:', error);
      }
    }

    // Adicionar à queue para sync posterior
    this.syncQueue.push(fullOperation);
    await this.persistQueue();
    
    // Notificar sobre operação pendente
    this.notifyPendingOperation(fullOperation);
    
    console.log(`[SyncManager] Operação ${fullOperation.operation} agendada para ${fullOperation.table}`);
    return fullOperation.id;
  }

  async triggerSync(): Promise<SyncResult> {
    if (this.isSyncing || !this.isOnline) {
      return { success: 0, failed: 0, pending: this.syncQueue.length, errors: [] };
    }

    this.isSyncing = true;
    console.log(`[SyncManager] Iniciando sync de ${this.syncQueue.length} operações`);

    const result: SyncResult = {
      success: 0,
      failed: 0,
      pending: 0,
      errors: []
    };

    try {
      // Carregar operações do storage
      await this.loadQueueFromStorage();

      if (this.syncQueue.length === 0) {
        return result;
      }

      // Ordenar por prioridade e timestamp
      this.sortQueueByPriority();

      // Processar em lotes
      await this.processQueueInBatches(result);

      // Salvar queue atualizada
      await this.persistQueue();

      result.pending = this.syncQueue.length;

      // Notificar listeners
      this.notifyListeners(result);

      console.log(`[SyncManager] Sync completo: ${result.success} sucessos, ${result.failed} falhas, ${result.pending} pendentes`);

    } catch (error) {
      console.error('[SyncManager] Erro durante sync:', error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private sortQueueByPriority(): void {
    this.syncQueue.sort((a, b) => {
      // Primeiro por prioridade
      const priorityA = this.syncConfig.priorityOrder.indexOf(a.priority);
      const priorityB = this.syncConfig.priorityOrder.indexOf(b.priority);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Depois por timestamp (mais antigo primeiro)
      return a.timestamp - b.timestamp;
    });
  }

  private async processQueueInBatches(result: SyncResult): Promise<void> {
    const batches = this.chunkArray(this.syncQueue, this.syncConfig.batchSize);

    for (const batch of batches) {
      if (!this.isOnline) {
        console.log('[SyncManager] Conexão perdida durante sync');
        break;
      }

      await Promise.allSettled(
        batch.map(async (operation, index) => {
          try {
            await this.executeOperation(operation);
            result.success++;
            this.removeFromQueue(operation.id);
            this.notifyOperationSuccess(operation);
          } catch (error) {
            await this.handleOperationError(operation, error as Error, result);
          }
        })
      );

      // Pausa entre lotes para não sobrecarregar
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  private async executeOperation(operation: PendingOperation): Promise<void> {
    const { operation: op, table, data, tenant_id } = operation;

    try {
      switch (op) {
        case 'CREATE':
          const createResult = await supabase
            .from(table as any)
            .insert({ ...data, tenant_id })
            .select()
            .single();
          
          if (createResult.error) throw createResult.error;
          
          // Atualizar dados locais com ID retornado do servidor
          if (createResult.data && (createResult.data as any)?.id && data.id !== (createResult.data as any).id) {
            await this.updateLocalRecord(table, data.id, createResult.data);
          }
          break;

        case 'UPDATE':
          const updateResult = await supabase
            .from(table as any)
            .update(data)
            .eq('id', data.id)
            .eq('tenant_id', tenant_id)
            .select()
            .single();
          
          if (updateResult.error) throw updateResult.error;
          
          // Verificar conflitos e resolver
          if (updateResult.data) {
            await this.resolveConflict(table, data, updateResult.data);
          }
          break;

        case 'DELETE':
          const deleteResult = await supabase
            .from(table as any)
            .delete()
            .eq('id', data.id)
            .eq('tenant_id', tenant_id);
          
          if (deleteResult.error) throw deleteResult.error;
          
          // Remover do storage local
          await this.removeLocalRecord(table, data.id);
          break;

        default:
          throw new Error(`Operação não suportada: ${op}`);
      }

      console.log(`[SyncManager] Operação ${op} em ${table} executada com sucesso`);

    } catch (error) {
      console.error(`[SyncManager] Erro na operação ${op} em ${table}:`, error);
      throw error;
    }
  }

  private async handleOperationError(
    operation: PendingOperation,
    error: Error,
    result: SyncResult
  ): Promise<void> {
    operation.retryCount++;

    // Verificar se deve tentar novamente
    if (operation.retryCount >= this.syncConfig.maxRetries) {
      console.error(`[SyncManager] Operação ${operation.id} falhou após ${this.syncConfig.maxRetries} tentativas`);
      
      result.failed++;
      result.errors.push({ operation, error: error.message });
      
      this.removeFromQueue(operation.id);
      this.notifyOperationFailed(operation, error);
      return;
    }

    // Agendar retry com backoff exponencial
    const delay = this.syncConfig.retryDelays[operation.retryCount - 1] || 300000; // Default 5min
    
    console.log(`[SyncManager] Reagendando operação ${operation.id} em ${delay}ms (tentativa ${operation.retryCount})`);
    
    setTimeout(() => {
      if (this.isOnline) {
        this.triggerSync();
      }
    }, delay);
  }

  private async resolveConflict(table: string, localData: any, serverData: any): Promise<void> {
    // Implementar estratégias de resolução de conflito
    switch (this.syncConfig.conflictResolution) {
      case 'server':
        // Servidor sempre ganha - atualizar dados locais
        await this.updateLocalRecord(table, localData.id, serverData);
        break;
        
      case 'client':
        // Cliente sempre ganha - forçar atualização no servidor
        // (seria necessário implementar endpoint específico)
        console.log('[SyncManager] Conflito resolvido a favor do cliente');
        break;
        
      case 'manual':
        // Notificar usuário sobre conflito
        this.notifyConflict(table, localData, serverData);
        break;
    }
  }

  private async updateLocalRecord(table: string, localId: string, serverData: any): Promise<void> {
    try {
      await this.offlineDB.storeData(
        table as any,
        serverData,
        DataSensitivity.BUSINESS,
        { id: localId, pendingSync: false }
      );
    } catch (error) {
      console.error('[SyncManager] Erro ao atualizar registro local:', error);
    }
  }

  private async removeLocalRecord(table: string, id: string): Promise<void> {
    try {
      await this.offlineDB.deleteBath(table as any, [id]);
    } catch (error) {
      console.error('[SyncManager] Erro ao remover registro local:', error);
    }
  }

  private removeFromQueue(operationId: string): void {
    this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
  }

  private async loadQueueFromStorage(): Promise<void> {
    try {
      const operations = await this.offlineDB.getPendingOperations();
      this.syncQueue = operations;
    } catch (error) {
      console.error('[SyncManager] Erro ao carregar queue do storage:', error);
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      // Limpar operações antigas do storage
      const currentIds = this.syncQueue.map(op => op.id);
      const allOperations = await this.offlineDB.getPendingOperations();
      const toDelete = allOperations
        .filter(op => !currentIds.includes(op.id))
        .map(op => op.id);
      
      if (toDelete.length > 0) {
        await this.offlineDB.deleteBath('pendingOperations', toDelete);
      }

      // Salvar operações atuais
      for (const operation of this.syncQueue) {
        await this.offlineDB.storeData(
          'pendingOperations',
          operation,
          DataSensitivity.BUSINESS,
          { id: operation.id, priority: operation.priority }
        );
      }
    } catch (error) {
      console.error('[SyncManager] Erro ao persistir queue:', error);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Notificações
  private notifyPendingOperation(operation: PendingOperation): void {
    // Implementar notificação visual para usuário
    console.log(`[SyncManager] Operação ${operation.operation} pendente para ${operation.table}`);
    
    // Você pode adicionar toast notification aqui
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PENDING_OPERATION',
        operation
      });
    }
  }

  private notifyOperationSuccess(operation: PendingOperation): void {
    console.log(`[SyncManager] Operação ${operation.operation} sincronizada com sucesso`);
  }

  private notifyOperationFailed(operation: PendingOperation, error: Error): void {
    console.error(`[SyncManager] Operação ${operation.operation} falhou definitivamente:`, error);
    
    // Notificar usuário sobre falha
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'OPERATION_FAILED',
        operation,
        error: error.message
      });
    }
  }

  private notifyConflict(table: string, localData: any, serverData: any): void {
    console.warn(`[SyncManager] Conflito detectado em ${table}:`, { localData, serverData });
    
    // Implementar UI de resolução de conflito
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'DATA_CONFLICT',
        table,
        localData,
        serverData
      });
    }
  }

  private notifyListeners(result: SyncResult): void {
    this.listeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('[SyncManager] Erro ao notificar listener:', error);
      }
    });
  }

  // API Pública
  onSyncComplete(callback: (result: SyncResult) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async getSyncStats(): Promise<{
    queueSize: number;
    lastSync: number | null;
    isOnline: boolean;
    isSyncing: boolean;
    failedOperations: number;
  }> {
    const operations = await this.offlineDB.getPendingOperations();
    const failedOperations = operations.filter(
      op => op.retryCount >= this.syncConfig.maxRetries
    ).length;

    return {
      queueSize: this.syncQueue.length,
      lastSync: this.syncQueue.length > 0 ? Math.max(...this.syncQueue.map(op => op.timestamp)) : null,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      failedOperations
    };
  }

  async clearFailedOperations(): Promise<void> {
    const toRemove = this.syncQueue
      .filter(op => op.retryCount >= this.syncConfig.maxRetries)
      .map(op => op.id);
    
    await this.offlineDB.deleteBath('pendingOperations', toRemove);
    this.syncQueue = this.syncQueue.filter(op => op.retryCount < this.syncConfig.maxRetries);
  }

  async forceSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync já em andamento');
      return { success: 0, failed: 0, pending: this.syncQueue.length, errors: [] };
    }

    return this.triggerSync();
  }

  destroy(): void {
    // Cleanup
    this.listeners.clear();
    window.removeEventListener('online', this.triggerSync);
    window.removeEventListener('offline', () => this.isOnline = false);
  }
}