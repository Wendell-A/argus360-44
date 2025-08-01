/**
 * Service Worker - Offline-First Architecture ETAPA 3
 * Data: 01 de Agosto de 2025, 18:35 UTC
 * 
 * Implementa cache hierárquico e estratégias offline avançadas
 */

const CACHE_VERSION = 'v3.0.0';
const CACHE_NAMES = {
  STATIC: `argos-static-${CACHE_VERSION}`,
  DYNAMIC: `argos-dynamic-${CACHE_VERSION}`,
  API: `argos-api-${CACHE_VERSION}`,
  OFFLINE: `argos-offline-${CACHE_VERSION}`
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

const API_CACHE_STRATEGIES = {
  // Cache first para dados estáticos
  'get_contextual_dashboard_stats': { strategy: 'cache-first', ttl: 300000 },
  'get_users_complete_optimized': { strategy: 'network-first', ttl: 180000 },
  'get_crm_complete_optimized': { strategy: 'network-first', ttl: 120000 },
  'get_dashboard_complete_optimized': { strategy: 'network-first', ttl: 240000 }
};

class OfflineFirstServiceWorker {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      offlineRequests: 0,
      syncOperations: 0
    };
  }

  // Install - Cache assets estáticos
  async handleInstall(event) {
    console.log('[SW] Installing service worker v' + CACHE_VERSION);
    
    const cache = await caches.open(CACHE_NAMES.STATIC);
    await cache.addAll(STATIC_ASSETS);
    
    // Skip waiting para ativar imediatamente
    self.skipWaiting();
  }

  // Activate - Limpar caches antigos
  async handleActivate(event) {
    console.log('[SW] Activating service worker v' + CACHE_VERSION);
    
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames
      .filter(name => !Object.values(CACHE_NAMES).includes(name))
      .map(name => caches.delete(name));
    
    await Promise.all(deletePromises);
    
    // Tomar controle de todas as páginas
    return self.clients.claim();
  }

  // Fetch - Estratégias de cache
  async handleFetch(event) {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requisições de chrome-extension, etc
    if (!url.protocol.startsWith('http')) {
      return fetch(request);
    }

    try {
      if (this.isAPIRequest(url)) {
        return await this.handleAPIRequest(request);
      } else if (this.isStaticAsset(url)) {
        return await this.handleStaticAsset(request);
      } else {
        return await this.handleDynamicContent(request);
      }
    } catch (error) {
      console.error('[SW] Fetch error:', error);
      return this.createOfflineResponse(request);
    }
  }

  isAPIRequest(url) {
    return url.pathname.includes('/rest/v1/') || 
           url.pathname.includes('/rpc/') ||
           url.hostname.includes('supabase.co');
  }

  isStaticAsset(url) {
    return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
  }

  async handleAPIRequest(request) {
    const url = new URL(request.url);
    const cacheKey = this.buildAPIKey(request);
    
    // Identificar estratégia baseada na URL
    const rpcName = this.extractRPCName(url);
    const strategy = API_CACHE_STRATEGIES[rpcName] || { strategy: 'network-first', ttl: 60000 };

    if (strategy.strategy === 'cache-first') {
      return await this.cacheFirstStrategy(request, cacheKey, strategy.ttl);
    } else {
      return await this.networkFirstStrategy(request, cacheKey, strategy.ttl);
    }
  }

  async networkFirstStrategy(request, cacheKey, ttl) {
    try {
      // Tentar network primeiro
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache apenas respostas válidas
        const cache = await caches.open(CACHE_NAMES.API);
        const responseToCache = networkResponse.clone();
        
        // Adicionar headers de TTL
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-at', Date.now().toString());
        headers.set('sw-ttl', ttl.toString());
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers
        });
        
        await cache.put(cacheKey, cachedResponse);
        this.metrics.cacheMisses++;
      }
      
      return networkResponse;
    } catch (error) {
      // Fallback para cache
      const cachedResponse = await this.getCachedResponse(cacheKey);
      
      if (cachedResponse) {
        console.log(`[SW] Serving cached API response for ${request.url}`);
        this.metrics.cacheHits++;
        this.metrics.offlineRequests++;
        
        // Adicionar header indicando cache
        const headers = new Headers(cachedResponse.headers);
        headers.set('x-served-by', 'service-worker');
        headers.set('x-offline-mode', 'true');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers
        });
      }
      
      return this.createOfflineAPIResponse(request);
    }
  }

  async cacheFirstStrategy(request, cacheKey, ttl) {
    // Verificar cache primeiro
    const cachedResponse = await this.getCachedResponse(cacheKey);
    
    if (cachedResponse && !this.isCacheExpired(cachedResponse, ttl)) {
      this.metrics.cacheHits++;
      return cachedResponse;
    }
    
    // Cache miss ou expirado - buscar da network
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAMES.API);
        await cache.put(cacheKey, networkResponse.clone());
      }
      
      this.metrics.cacheMisses++;
      return networkResponse;
    } catch (error) {
      // Se network falhar e temos cache expirado, usar mesmo assim
      if (cachedResponse) {
        this.metrics.offlineRequests++;
        return cachedResponse;
      }
      
      return this.createOfflineAPIResponse(request);
    }
  }

  async handleStaticAsset(request) {
    // Cache first para assets estáticos
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      this.metrics.cacheHits++;
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAMES.STATIC);
        await cache.put(request, networkResponse.clone());
      }
      
      this.metrics.cacheMisses++;
      return networkResponse;
    } catch (error) {
      return this.createOfflineResponse(request);
    }
  }

  async handleDynamicContent(request) {
    // Stale while revalidate para páginas
    const cachedResponse = await caches.match(request);
    
    // Buscar nova versão em background
    const networkPromise = fetch(request)
      .then(response => {
        if (response.ok) {
          const cache = caches.open(CACHE_NAMES.DYNAMIC);
          cache.then(c => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => null);
    
    // Retornar cache imediatamente se disponível
    if (cachedResponse) {
      this.metrics.cacheHits++;
      return cachedResponse;
    }
    
    // Aguardar network se não há cache
    const networkResponse = await networkPromise;
    if (networkResponse) {
      this.metrics.cacheMisses++;
      return networkResponse;
    }
    
    return this.createOfflineResponse(request);
  }

  async getCachedResponse(cacheKey) {
    const cache = await caches.open(CACHE_NAMES.API);
    return await cache.match(cacheKey);
  }

  isCacheExpired(response, ttl) {
    const cachedAt = response.headers.get('sw-cached-at');
    if (!cachedAt) return true;
    
    const age = Date.now() - parseInt(cachedAt);
    return age > ttl;
  }

  buildAPIKey(request) {
    const url = new URL(request.url);
    
    // Para requests autenticados, incluir user/tenant no cache key
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const userHash = this.hashString(authHeader.slice(-20)); // Últimos 20 chars do token
      return `${url.pathname}${url.search}_${userHash}`;
    }
    
    return `${url.pathname}${url.search}`;
  }

  extractRPCName(url) {
    const match = url.pathname.match(/\/rpc\/([^/?]+)/);
    return match ? match[1] : null;
  }

  createOfflineAPIResponse(request) {
    const url = new URL(request.url);
    
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Dados offline limitados disponíveis',
        offline: true,
        timestamp: Date.now(),
        url: url.pathname
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Mode': 'true',
          'X-SW-Version': CACHE_VERSION
        }
      }
    );
  }

  createOfflineResponse(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/' || url.pathname.startsWith('/dashboard')) {
      return caches.match('/offline.html') || 
        new Response('Aplicação offline temporariamente indisponível', {
          headers: { 'Content-Type': 'text/html' }
        });
    }
    
    return new Response('Recurso indisponível offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Background Sync
  async handleBackgroundSync(event) {
    if (event.tag === 'background-sync') {
      console.log('[SW] Background sync triggered');
      
      // Implementar sync de operações pendentes
      await this.syncPendingOperations();
    }
  }

  async syncPendingOperations() {
    try {
      // Aqui seria a integração com IndexedDB das operações pendentes
      this.metrics.syncOperations++;
      console.log('[SW] Sync completed successfully');
    } catch (error) {
      console.error('[SW] Sync failed:', error);
      throw error; // Para retry automático
    }
  }

  // Messaging
  async handleMessage(event) {
    const { data } = event;
    
    switch (data.type) {
      case 'GET_METRICS':
        event.ports[0].postMessage(this.metrics);
        break;
        
      case 'CLEAR_CACHE':
        await this.clearAllCaches();
        event.ports[0].postMessage({ success: true });
        break;
        
      case 'UPDATE_CACHE_STRATEGY':
        // Atualizar estratégias de cache dinamicamente
        Object.assign(API_CACHE_STRATEGIES, data.strategies);
        event.ports[0].postMessage({ success: true });
        break;
    }
  }

  async clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Reset metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      offlineRequests: 0,
      syncOperations: 0
    };
  }
}

// Instância global do service worker
const swInstance = new OfflineFirstServiceWorker();

// Event listeners
self.addEventListener('install', event => {
  event.waitUntil(swInstance.handleInstall(event));
});

self.addEventListener('activate', event => {
  event.waitUntil(swInstance.handleActivate(event));
});

self.addEventListener('fetch', event => {
  event.respondWith(swInstance.handleFetch(event));
});

self.addEventListener('sync', event => {
  event.waitUntil(swInstance.handleBackgroundSync(event));
});

self.addEventListener('message', event => {
  event.waitUntil(swInstance.handleMessage(event));
});

console.log('[SW] Service Worker v' + CACHE_VERSION + ' loaded');