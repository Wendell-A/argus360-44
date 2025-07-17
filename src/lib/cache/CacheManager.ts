
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  private defaultTTL = 5 * 60 * 1000; // 5 minutos
  private maxSize = 1000;

  set<T>(key: string, data: T, ttl?: number): void {
    const actualTTL = ttl || this.defaultTTL;
    
    // Limpar cache se necessário
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTTL,
      key
    });

    this.stats.sets++;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.deletes += count;
    return count;
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remover entradas expiradas
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });

    // Se ainda estiver cheio, remover as mais antigas
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(this.maxSize * 0.2)); // Remove 20% das mais antigas

      sortedEntries.forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  getStats(): CacheStats & { hitRate: number; size: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      size: this.cache.size
    };
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }
}

export const cacheManager = new CacheManager();
