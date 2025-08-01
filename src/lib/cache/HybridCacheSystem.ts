/**
 * Sistema de Cache Híbrido - ETAPA 2
 * Data: 31 de Janeiro de 2025, 02:59 UTC
 * 
 * Implementação de cache em 3 camadas:
 * L1: Memory (rápido, volátil) - dados públicos
 * L2: IndexedDB (persistente, criptografado) - dados pessoais/business
 * L3: Service Worker (offline, estático) - assets
 */

import { DataSensitivity, containsSensitiveData, getMaxSensitivity } from '@/lib/security/DataClassification';
import { monitoring } from '@/lib/monitoring';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  sensitivity: DataSensitivity;
  tenantId: string;
  userId: string;
  encrypted: boolean;
}

interface CacheLayer {
  name: string;
  capacity: number;
  ttl: number;
  encryption: boolean;
  persistence: boolean;
}

interface CacheMetrics {
  l1Hits: number;
  l2Hits: number;
  l3Hits: number;
  misses: number;
  evictions: number;
  encryptionTime: number;
  size: number;
}

export const CACHE_STRATEGIES = {
  'user-profile': {
    sensitivity: DataSensitivity.PERSONAL,
    ttl: 300000,        // 5 minutos
    layers: ['L2'],     // Apenas IndexedDB criptografado
    invalidateOn: ['profile-update', 'logout']
  },
  'office-list': {
    sensitivity: DataSensitivity.PUBLIC,
    ttl: 1800000,       // 30 minutos
    layers: ['L1', 'L3'], // Memory + ServiceWorker
    invalidateOn: ['office-change']
  },
  'commission-data': {
    sensitivity: DataSensitivity.BUSINESS,
    ttl: 600000,        // 10 minutos
    layers: ['L2'],     // Apenas IndexedDB
    invalidateOn: ['commission-update', 'sale-approved']
  },
  'static-assets': {
    sensitivity: DataSensitivity.PUBLIC,
    ttl: 86400000,      // 24 horas
    layers: ['L3'],     // Apenas ServiceWorker
    invalidateOn: ['app-update']
  },
  'dashboard-stats': {
    sensitivity: DataSensitivity.BUSINESS,
    ttl: 300000,        // 5 minutos
    layers: ['L1', 'L2'], // Memory + IndexedDB
    invalidateOn: ['sales-update', 'commission-update']
  }
} as const;

export class HybridCacheSystem {
  private l1Memory: Map<string, CacheEntry> = new Map();
  private l2IndexedDB: IDBDatabase | null = null;
  private currentTenant: string = '';
  private currentUser: string = '';
  private metrics: CacheMetrics;
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.metrics = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      evictions: 0,
      encryptionTime: 0,
      size: 0
    };
    this.initializeIndexedDB();
    this.setupCleanupScheduler();
  }

  setContext(tenantId: string, userId: string): void {
    this.currentTenant = tenantId;
    this.currentUser = userId;
  }

  async get<T>(key: string, sensitivity?: DataSensitivity): Promise<T | null> {
    const tenantKey = this.buildSecureKey(key);
    const autoSensitivity = sensitivity || DataSensitivity.PUBLIC;

    const timer = monitoring.startTimer('hybrid_cache_get', { 
      key: key.substring(0, 50),
      sensitivity: autoSensitivity
    });

    try {
      // L1: Memory first (mais rápido) - apenas dados públicos
      if (autoSensitivity === DataSensitivity.PUBLIC) {
        const l1Result = this.l1Memory.get(tenantKey);
        if (l1Result && !this.isExpired(l1Result)) {
          this.recordCacheHit('L1', tenantKey);
          timer.end();
          return l1Result.data;
        }
      }

      // L2: IndexedDB para dados pessoais/business
      if (autoSensitivity === DataSensitivity.PERSONAL || autoSensitivity === DataSensitivity.BUSINESS) {
        const l2Result = await this.getFromIndexedDB<T>(tenantKey);
        if (l2Result) {
          this.recordCacheHit('L2', tenantKey);
          
          // Promote para L1 se público
          if (autoSensitivity === DataSensitivity.PUBLIC) {
            this.l1Memory.set(tenantKey, {
              data: l2Result,
              timestamp: Date.now(),
              ttl: CACHE_STRATEGIES['office-list'].ttl,
              sensitivity: autoSensitivity,
              tenantId: this.currentTenant,
              userId: this.currentUser,
              encrypted: false
            });
          }
          
          timer.end();
          return l2Result;
        }
      }

      // L3: Service Worker para assets estáticos
      if (autoSensitivity === DataSensitivity.PUBLIC) {
        const l3Result = await this.getFromServiceWorker<T>(tenantKey);
        if (l3Result) {
          this.recordCacheHit('L3', tenantKey);
          timer.end();
          return l3Result;
        }
      }

      this.recordCacheMiss(tenantKey);
      timer.end();
      return null;
    } catch (error) {
      console.error('Hybrid cache get error:', error);
      timer.end();
      return null;
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    sensitivity: DataSensitivity, 
    ttl?: number
  ): Promise<void> {
    if (!this.currentTenant || !this.currentUser) {
      console.warn('Cache context not set - skipping cache');
      return;
    }

    const tenantKey = this.buildSecureKey(key);
    const effectiveTTL = ttl || CACHE_STRATEGIES['office-list'].ttl;

    const timer = monitoring.startTimer('hybrid_cache_set', { 
      key: key.substring(0, 50),
      sensitivity
    });

    try {
      // Nunca cachear dados CRITICAL
      if (sensitivity === DataSensitivity.CRITICAL) {
        console.warn(`SECURITY: Tentativa de cache de dados CRITICAL bloqueada: ${key}`);
        timer.end();
        return;
      }

      // Sanitizar dados antes de cachear
      const sanitizedData = await this.sanitizeData(data, sensitivity);

      // Auto-detectar sensibilidade se necessário
      if (typeof data === 'object' && data !== null) {
        const detectedSensitivity = getMaxSensitivity(data as any);
        if (detectedSensitivity === DataSensitivity.CRITICAL) {
          console.warn(`SECURITY: Dados CRITICAL detectados e bloqueados: ${key}`);
          timer.end();
          return;
        }
      }

      const entry: CacheEntry<T> = {
        data: sanitizedData,
        timestamp: Date.now(),
        ttl: effectiveTTL,
        sensitivity,
        tenantId: this.currentTenant,
        userId: this.currentUser,
        encrypted: false
      };

      // Aplicar estratégia por sensibilidade
      switch (sensitivity) {
        case DataSensitivity.PERSONAL:
          // Cache criptografado com TTL curto
          await this.setInIndexedDB(tenantKey, entry, true);
          break;
          
        case DataSensitivity.BUSINESS:
          // Cache com TTL médio e auditoria
          await this.setInIndexedDB(tenantKey, entry, false);
          this.auditCacheOperation('SET', key, sensitivity);
          break;
          
        case DataSensitivity.PUBLIC:
          // Cache normal com TTL longo - múltiplas camadas
          this.l1Memory.set(tenantKey, entry);
          await this.setInServiceWorker(tenantKey, entry);
          break;
      }

      // Manter tamanho do cache L1
      this.enforceL1SizeLimit();
      timer.end();
    } catch (error) {
      console.error('Hybrid cache set error:', error);
      timer.end();
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    let invalidated = 0;

    // L1: Memory
    for (const [key, entry] of this.l1Memory.entries()) {
      if (key.includes(pattern) && entry.tenantId === this.currentTenant) {
        this.l1Memory.delete(key);
        invalidated++;
      }
    }

    // L2: IndexedDB
    if (this.l2IndexedDB) {
      const transaction = this.l2IndexedDB.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('by-tenant');
      
      const request = index.getAll(this.currentTenant);
      request.onsuccess = () => {
        request.result.forEach(record => {
          if (record.key.includes(pattern)) {
            store.delete(record.key);
            invalidated++;
          }
        });
      };
    }

    return invalidated;
  }

  private buildSecureKey(key: string): string {
    if (!this.currentTenant || !this.currentUser) {
      throw new Error('Cache context not set');
    }
    return `${this.currentTenant}_${this.currentUser}_${key}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private async sanitizeData<T>(data: T, sensitivity: DataSensitivity): Promise<T> {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data } as any;

    // Remove campos críticos independente da sensibilidade
    const criticalFields = ['password', 'token', 'secret', 'api_key', 'private_key'];
    criticalFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ArgosHybridCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.l2IndexedDB = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('by-tenant', 'tenantId', { unique: false });
          store.createIndex('by-timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    if (!this.l2IndexedDB) return null;

    return new Promise((resolve) => {
      const transaction = this.l2IndexedDB!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      
      request.onsuccess = async () => {
        const record = request.result;
        if (!record || this.isExpired(record)) {
          resolve(null);
          return;
        }

        // Descriptografar se necessário
        if (record.encrypted) {
          try {
            const decrypted = await this.decrypt(record.data);
            resolve(decrypted);
          } catch (error) {
            console.error('Decryption error:', error);
            resolve(null);
          }
        } else {
          resolve(record.data);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  }

  private async setInIndexedDB(key: string, entry: CacheEntry, encrypt: boolean): Promise<void> {
    if (!this.l2IndexedDB) return;

    const transaction = this.l2IndexedDB.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');

    if (encrypt) {
      const encryptionTimer = Date.now();
      entry.data = await this.encrypt(entry.data);
      entry.encrypted = true;
      this.metrics.encryptionTime += Date.now() - encryptionTimer;
    }

    const record = {
      key,
      ...entry
    };

    store.put(record);
  }

  private async getFromServiceWorker<T>(key: string): Promise<T | null> {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const response = await fetch(`/cache/${key}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Service Worker não disponível ou erro
    }
    
    return null;
  }

  private async setInServiceWorker(key: string, entry: CacheEntry): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      // Enviar para Service Worker via MessageChannel
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_SET',
          key,
          data: entry.data,
          ttl: entry.ttl
        });
      }
    } catch (error) {
      console.warn('Service Worker cache error:', error);
    }
  }

  private recordCacheHit(layer: 'L1' | 'L2' | 'L3', key: string): void {
    this.metrics[`${layer.toLowerCase()}Hits` as keyof CacheMetrics]++;
    
    monitoring.recordMetric({
      name: 'hybrid_cache_hit',
      duration: 0,
      timestamp: Date.now(),
      metadata: { 
        layer, 
        key: key.substring(0, 50),
        tenantId: this.currentTenant
      }
    });
  }

  private recordCacheMiss(key: string): void {
    this.metrics.misses++;
    
    monitoring.recordMetric({
      name: 'hybrid_cache_miss',
      duration: 0,
      timestamp: Date.now(),
      metadata: { 
        key: key.substring(0, 50),
        tenantId: this.currentTenant
      }
    });
  }

  private enforceL1SizeLimit(): void {
    const maxSize = 100; // 100 entradas máximo no L1
    
    if (this.l1Memory.size > maxSize) {
      // Remover as entradas mais antigas
      const entries = Array.from(this.l1Memory.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, this.l1Memory.size - maxSize);
      toRemove.forEach(([key]) => {
        this.l1Memory.delete(key);
        this.metrics.evictions++;
      });
    }
  }

  private setupCleanupScheduler(): void {
    // Limpeza a cada 5 minutos
    setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  private async cleanup(): Promise<void> {
    // Limpar L1 expirados
    for (const [key, entry] of this.l1Memory.entries()) {
      if (this.isExpired(entry)) {
        this.l1Memory.delete(key);
      }
    }

    // Limpar L2 expirados
    if (this.l2IndexedDB) {
      const transaction = this.l2IndexedDB.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('by-timestamp');
      
      const cutoff = Date.now() - 86400000; // 24 horas atrás
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    }
  }

  private async encrypt(data: any): Promise<string> {
    // Placeholder - implementação real seria com Web Crypto API
    try {
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      return btoa(String.fromCharCode(...encoded));
    } catch (error) {
      console.error('Encryption error:', error);
      return JSON.stringify(data);
    }
  }

  private async decrypt(encryptedData: string): Promise<any> {
    // Placeholder - implementação real seria com Web Crypto API
    try {
      const decoded = atob(encryptedData);
      const uint8Array = new Uint8Array(decoded.split('').map(char => char.charCodeAt(0)));
      const jsonString = new TextDecoder().decode(uint8Array);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData;
    }
  }

  private auditCacheOperation(operation: string, key: string, sensitivity: DataSensitivity): void {
    monitoring.recordMetric({
      name: 'cache_audit',
      duration: 0,
      timestamp: Date.now(),
      metadata: { 
        operation, 
        key: key.substring(0, 50), 
        sensitivity,
        tenantId: this.currentTenant,
        userId: this.currentUser
      }
    });
  }

  getMetrics(): CacheMetrics & { hitRate: number } {
    const totalRequests = this.metrics.l1Hits + this.metrics.l2Hits + this.metrics.l3Hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? 
      ((this.metrics.l1Hits + this.metrics.l2Hits + this.metrics.l3Hits) / totalRequests) * 100 : 0;

    return {
      ...this.metrics,
      hitRate
    };
  }

  clear(): void {
    this.l1Memory.clear();
    this.metrics = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      evictions: 0,
      encryptionTime: 0,
      size: 0
    };
  }
}

// Singleton instance
export const hybridCache = new HybridCacheSystem();