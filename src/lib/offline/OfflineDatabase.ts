/**
 * Offline Database - IndexedDB para Dados Críticos ETAPA 3
 * Data: 01 de Agosto de 2025, 18:40 UTC
 * 
 * Sistema robusto de armazenamento offline com criptografia
 */

import { DataSensitivity } from '@/lib/security/DataClassification';

interface OfflineDBSchema {
  users: {
    key: string;
    value: {
      id: string;
      data: any;
      lastSync: number;
      tenant_id: string;
      sensitivity: DataSensitivity;
      encrypted: boolean;
    };
    indexes: {
      'by-tenant': string;
      'by-sync': number;
      'by-sensitivity': DataSensitivity;
    };
  };
  sales: {
    key: string;
    value: {
      id: string;
      data: any;
      lastSync: number;
      tenant_id: string;
      pendingSync: boolean;
      localChanges: boolean;
    };
    indexes: {
      'by-tenant': string;
      'by-pending': boolean;
      'by-changes': boolean;
    };
  };
  pendingOperations: {
    key: string;
    value: {
      id: string;
      operation: 'CREATE' | 'UPDATE' | 'DELETE';
      table: string;
      data: any;
      timestamp: number;
      retryCount: number;
      tenant_id: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    indexes: {
      'by-timestamp': number;
      'by-tenant': string;
      'by-priority': string;
    };
  };
  cacheEntries: {
    key: string;
    value: {
      id: string;
      cacheKey: string;
      data: any;
      sensitivity: DataSensitivity;
      ttl: number;
      createdAt: number;
      accessCount: number;
      tenant_id: string;
    };
    indexes: {
      'by-tenant': string;
      'by-ttl': number;
      'by-sensitivity': DataSensitivity;
    };
  };
}

export interface PendingOperation {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  tenant_id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ArgosOfflineDB';
  private readonly DB_VERSION = 3;
  private encryptionKey: CryptoKey | null = null;
  private currentTenant: string | null = null;
  private currentUser: string | null = null;

  async initialize(tenantId: string, userId: string): Promise<void> {
    this.currentTenant = tenantId;
    this.currentUser = userId;
    
    // Gerar chave de criptografia específica para o tenant/user
    await this.initializeEncryption(tenantId, userId);
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('[OfflineDB] Error opening database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineDB] Database opened successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Store para usuários
    if (!db.objectStoreNames.contains('users')) {
      const userStore = db.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('by-tenant', 'tenant_id', { unique: false });
      userStore.createIndex('by-sync', 'lastSync', { unique: false });
      userStore.createIndex('by-sensitivity', 'sensitivity', { unique: false });
    }
    
    // Store para vendas
    if (!db.objectStoreNames.contains('sales')) {
      const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
      salesStore.createIndex('by-tenant', 'tenant_id', { unique: false });
      salesStore.createIndex('by-pending', 'pendingSync', { unique: false });
      salesStore.createIndex('by-changes', 'localChanges', { unique: false });
    }
    
    // Store para operações pendentes
    if (!db.objectStoreNames.contains('pendingOperations')) {
      const opsStore = db.createObjectStore('pendingOperations', { keyPath: 'id' });
      opsStore.createIndex('by-timestamp', 'timestamp', { unique: false });
      opsStore.createIndex('by-tenant', 'tenant_id', { unique: false });
      opsStore.createIndex('by-priority', 'priority', { unique: false });
    }
    
    // Store para cache entries
    if (!db.objectStoreNames.contains('cacheEntries')) {
      const cacheStore = db.createObjectStore('cacheEntries', { keyPath: 'id' });
      cacheStore.createIndex('by-tenant', 'tenant_id', { unique: false });
      cacheStore.createIndex('by-ttl', 'ttl', { unique: false });
      cacheStore.createIndex('by-sensitivity', 'sensitivity', { unique: false });
    }
  }

  private async initializeEncryption(tenantId: string, userId: string): Promise<void> {
    try {
      // Gerar chave baseada em tenant/user
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(`${tenantId}_${userId}_argos_offline`),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      this.encryptionKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('argos_salt_2025'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('[OfflineDB] Encryption initialization failed:', error);
      throw error;
    }
  }

  async storeData<T>(
    storeName: keyof OfflineDBSchema,
    data: T,
    sensitivity: DataSensitivity,
    options: {
      id?: string;
      pendingSync?: boolean;
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    } = {}
  ): Promise<string> {
    if (!this.db || !this.currentTenant) {
      throw new Error('Database not initialized');
    }

    // Validar sensibilidade
    if (sensitivity === DataSensitivity.CRITICAL) {
      throw new Error('Dados CRITICAL não podem ser armazenados offline');
    }

    const id = options.id || crypto.randomUUID();
    
    // Preparar dados com sanitização
    const sanitizedData = await this.sanitizeForOfflineStorage(data, sensitivity);
    
    // Criptografar se necessário
    const shouldEncrypt = sensitivity === DataSensitivity.PERSONAL;
    const finalData = shouldEncrypt 
      ? await this.encryptData(sanitizedData)
      : sanitizedData;

    const record = {
      id,
      data: finalData,
      lastSync: Date.now(),
      tenant_id: this.currentTenant,
      sensitivity,
      encrypted: shouldEncrypt,
      pendingSync: options.pendingSync || false,
      localChanges: true,
      priority: options.priority || 'MEDIUM'
    };

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    try {
      await store.put(record);
      console.log(`[OfflineDB] Stored data in ${storeName}:`, id);
      return id;
    } catch (error) {
      console.error(`[OfflineDB] Error storing data in ${storeName}:`, error);
      throw error;
    }
  }

  async getData<T>(
    storeName: keyof OfflineDBSchema,
    options: {
      tenantId?: string;
      sensitivity?: DataSensitivity;
      pendingOnly?: boolean;
      limit?: number;
    } = {}
  ): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const tenantId = options.tenantId || this.currentTenant;
    if (!tenantId) {
      throw new Error('Tenant ID required');
    }

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const index = store.index('by-tenant');
      const request = index.getAll(tenantId);
      
      request.onsuccess = async () => {
        try {
          let results = request.result;
          
          // Filtrar por sensibilidade se especificado
          if (options.sensitivity) {
            results = results.filter(record => record.sensitivity === options.sensitivity);
          }
          
          // Filtrar apenas pendentes se especificado
          if (options.pendingOnly) {
            results = results.filter(record => record.pendingSync);
          }
          
          // Aplicar limite se especificado
          if (options.limit) {
            results = results.slice(0, options.limit);
          }
          
          // Descriptografar dados se necessário
          const decryptedResults = await Promise.all(
            results.map(async (record) => {
              if (record.encrypted) {
                record.data = await this.decryptData(record.data);
              }
              return record.data;
            })
          );
          
          resolve(decryptedResults);
        } catch (error) {
          reject(error);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: keyof OfflineDBSchema, id: string): Promise<T | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = async () => {
        try {
          const record = request.result;
          if (!record) {
            resolve(null);
            return;
          }
          
          // Verificar isolamento de tenant
          if (record.tenant_id !== this.currentTenant) {
            console.warn(`[OfflineDB] Tenant isolation violation: ${id}`);
            resolve(null);
            return;
          }
          
          // Descriptografar se necessário
          if (record.encrypted) {
            record.data = await this.decryptData(record.data);
          }
          
          resolve(record.data);
        } catch (error) {
          reject(error);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBath(storeName: keyof OfflineDBSchema, ids: string[]): Promise<void> {
    if (!this.db || !this.currentTenant) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const deletePromises = ids.map(id => {
      return new Promise<void>((resolve, reject) => {
        // Verificar tenant antes de deletar
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const record = getRequest.result;
          if (record && record.tenant_id === this.currentTenant) {
            const deleteRequest = store.delete(id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          } else {
            resolve(); // Ignorar se não é do tenant correto
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    });

    await Promise.all(deletePromises);
  }

  async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const fullOperation: PendingOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      tenant_id: operation.tenant_id || this.currentTenant!
    };

    await this.storeData('pendingOperations', fullOperation, DataSensitivity.BUSINESS, {
      id: fullOperation.id,
      priority: fullOperation.priority
    });

    return fullOperation.id;
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    return this.getData<PendingOperation>('pendingOperations', {
      pendingOnly: false,
      limit: 100
    });
  }

  async clearExpiredCache(): Promise<number> {
    if (!this.db) return 0;

    const now = Date.now();
    const transaction = this.db.transaction(['cacheEntries'], 'readwrite');
    const store = transaction.objectStore('cacheEntries');
    const index = store.index('by-ttl');
    
    return new Promise((resolve, reject) => {
      let deletedCount = 0;
      const request = index.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value;
          if (record.ttl < now) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async sanitizeForOfflineStorage<T>(
    data: T,
    sensitivity: DataSensitivity
  ): Promise<T> {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = { ...data };
    
    // Remover campos críticos completamente
    const criticalFields = ['password', 'token', 'secret', 'api_key', 'private_key'];
    criticalFields.forEach(field => {
      if (field in sanitized) {
        delete (sanitized as any)[field];
        console.warn(`[OfflineDB] Campo crítico removido: ${field}`);
      }
    });
    
    return sanitized;
  }

  private async encryptData(data: any): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encodedData
    );

    // Combinar IV + dados criptografados
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  private async decryptData(encryptedData: string): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encrypted
    );

    const decodedData = new TextDecoder().decode(decrypted);
    return JSON.parse(decodedData);
  }

  async getStorageStats(): Promise<{
    totalSize: number;
    stores: Record<string, { count: number; size: number }>;
    cacheStats: { expired: number; total: number };
  }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stores = ['users', 'sales', 'pendingOperations', 'cacheEntries'] as const;
    const stats: any = { totalSize: 0, stores: {}, cacheStats: { expired: 0, total: 0 } };
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const count = await new Promise<number>((resolve) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
      });
      
      stats.stores[storeName] = { count, size: count * 1024 }; // Estimativa
      stats.totalSize += stats.stores[storeName].size;
    }
    
    // Cache stats
    const now = Date.now();
    const cacheEntries = await this.getData<any>('cacheEntries');
    stats.cacheStats.total = cacheEntries.length;
    stats.cacheStats.expired = cacheEntries.filter(entry => entry.ttl < now).length;
    
    return stats;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.encryptionKey = null;
    this.currentTenant = null;
    this.currentUser = null;
  }
}