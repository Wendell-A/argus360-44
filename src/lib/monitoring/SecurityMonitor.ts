import { supabase } from '@/integrations/supabase/client';
import { DataSensitivity } from '@/lib/security/DataClassification';

export interface SecurityAlert {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
  action?: string;
  timestamp: number;
}

export interface AuditEntry {
  type: string;
  dataType: DataSensitivity;
  operation: string;
  resourceId: string;
  userId?: string;
  tenantId?: string;
  timestamp: number;
  userAgent: string;
  sessionId: string;
  ipAddress?: string;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alertThresholds = {
    CROSS_TENANT_ATTEMPTS: 3,        // 3 tentativas = alerta
    FAILED_LOGINS: 5,                // 5 falhas = bloqueio
    CACHE_VIOLATIONS: 1,             // 1 violação = alerta crítico
    SENSITIVE_DATA_EXPOSURE: 0,      // Zero tolerância
    SQL_INJECTION_ATTEMPTS: 1,       // 1 tentativa = alerta
    RAPID_ACCESS: 20                 // 20 acessos em 5min = suspeito
  };

  private recentAccessCache: Map<string, number[]> = new Map();
  private sessionId: string = crypto.randomUUID();

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  async detectTenantBleeding(cacheKey: string, expectedTenant: string): Promise<void> {
    if (!cacheKey.startsWith(`${expectedTenant}_`)) {
      await this.triggerSecurityAlert({
        type: 'TENANT_ISOLATION_VIOLATION',
        severity: 'CRITICAL',
        details: {
          cacheKey,
          expectedTenant,
          actualPrefix: cacheKey.split('_')[0],
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          ipAddress: await this.getClientIP()
        },
        action: 'BLOCK_REQUEST',
        timestamp: Date.now()
      });
    }
  }

  async auditSensitiveDataAccess(
    dataType: DataSensitivity,
    operation: string,
    resourceId: string
  ): Promise<void> {
    const userId = await this.getCurrentUserId();
    const tenantId = await this.getCurrentTenantId();

    const auditEntry: AuditEntry = {
      type: 'SENSITIVE_DATA_ACCESS',
      dataType,
      operation,
      resourceId,
      userId,
      tenantId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      ipAddress: await this.getClientIP()
    };

    // Log localmente
    await this.logToIndexedDB(auditEntry);
    
    // Enviar para servidor (se online)
    if (navigator.onLine) {
      await this.sendAuditToServer(auditEntry);
    }
    
    // Verificar padrões suspeitos
    await this.analyzeAccessPatterns(auditEntry);
  }

  private async analyzeAccessPatterns(entry: AuditEntry): Promise<void> {
    if (!entry.userId) return;

    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    // Obter acessos recentes do usuário
    const userAccess = this.recentAccessCache.get(entry.userId) || [];
    
    // Adicionar acesso atual
    userAccess.push(now);
    
    // Remover acessos antigos (> 5 minutos)
    const recentAccess = userAccess.filter(timestamp => timestamp > fiveMinutesAgo);
    
    // Atualizar cache
    this.recentAccessCache.set(entry.userId, recentAccess);

    // Verificar se excede threshold
    if (recentAccess.length > this.alertThresholds.RAPID_ACCESS) {
      await this.triggerSecurityAlert({
        type: 'SUSPICIOUS_ACCESS_PATTERN',
        severity: 'HIGH',
        details: {
          userId: entry.userId,
          accessCount: recentAccess.length,
          timeWindow: '5 minutes',
          pattern: 'RAPID_ACCESS',
          dataType: entry.dataType,
          operation: entry.operation
        },
        timestamp: now
      });
    }
  }

  async detectSqlInjection(query: string, params?: any[]): Promise<void> {
    const suspiciousPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
      /((\%27)|(\')|(\')|(\%3D)|(=))[^\n]*((\%27)|(\')|(\')|(\%3D)|(=))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))((\%20)|(\\s))*((\%55)|u|(\%75))((\%4E)|n|(\%6E))((\%49)|i|(\%69))((\%4F)|o|(\%6F))((\%4E)|n|(\%6E))/i
    ];

    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(query));
    
    if (hasSuspiciousPattern) {
      await this.triggerSecurityAlert({
        type: 'SQL_INJECTION_ATTEMPT',
        severity: 'CRITICAL',
        details: {
          query: query.substring(0, 200), // Apenas primeiros 200 chars por segurança
          params: params ? JSON.stringify(params).substring(0, 100) : null,
          patterns: suspiciousPatterns.filter(p => p.test(query)).map(p => p.source),
          timestamp: Date.now()
        },
        action: 'BLOCK_QUERY',
        timestamp: Date.now()
      });
    }
  }

  async logFailedLogin(email: string, reason: string): Promise<void> {
    const failedAttempts = await this.getFailedLoginCount(email, 60 * 60 * 1000); // 1 hora
    
    if (failedAttempts >= this.alertThresholds.FAILED_LOGINS) {
      await this.triggerSecurityAlert({
        type: 'MULTIPLE_FAILED_LOGINS',
        severity: 'HIGH',
        details: {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mascarar email
          attemptCount: failedAttempts + 1,
          timeWindow: '1 hour',
          reason,
          ipAddress: await this.getClientIP()
        },
        action: 'TEMPORARY_BLOCK',
        timestamp: Date.now()
      });
    }

    // Armazenar tentativa
    await this.storeFailedLogin(email, reason);
  }

  private async triggerSecurityAlert(alert: SecurityAlert): Promise<void> {
    console.error(`🚨 SECURITY ALERT [${alert.severity}]: ${alert.type}`, alert);

    // Armazenar alerta localmente
    await this.storeAlert(alert);

    // Enviar para servidor se online - usando audit_log
    if (navigator.onLine) {
      try {
        await supabase.from('audit_log').insert({
          action: `SECURITY_${alert.type}`,
          table_name: 'security_monitoring',
          new_values: JSON.stringify({
            type: alert.type,
            severity: alert.severity,
            details: alert.details,
            action: alert.action
          }),
          user_id: await this.getCurrentUserId(),
          tenant_id: await this.getCurrentTenantId(),
          ip_address: null,
          user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Failed to send security alert to server:', error);
      }
    }

    // Executar ações automáticas
    await this.executeAlertActions(alert);
  }

  private async executeAlertActions(alert: SecurityAlert): Promise<void> {
    switch (alert.action) {
      case 'BLOCK_REQUEST':
        // Implementar bloqueio de request
        break;
      case 'BLOCK_QUERY':
        // Implementar bloqueio de query
        break;
      case 'TEMPORARY_BLOCK':
        // Implementar bloqueio temporário de usuário
        break;
      default:
        // Apenas log
        break;
    }
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private async getCurrentTenantId(): Promise<string | undefined> {
    try {
      // Implementar lógica para obter tenant atual
      return localStorage.getItem('current_tenant_id') || undefined;
    } catch {
      return undefined;
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private async logToIndexedDB(entry: AuditEntry): Promise<void> {
    try {
      const db = await this.openAuditDB();
      const transaction = db.transaction(['audit_logs'], 'readwrite');
      const store = transaction.objectStore('audit_logs');
      await store.add({ ...entry, id: crypto.randomUUID() });
    } catch (error) {
      console.error('Failed to log audit entry to IndexedDB:', error);
    }
  }

  private async sendAuditToServer(entry: AuditEntry): Promise<void> {
    try {
        await supabase.from('audit_log').insert({
          action: `${entry.operation}_${entry.dataType}`,
          table_name: 'security_audit',
          record_id: entry.resourceId,
          new_values: JSON.stringify({
            operation: entry.operation,
            dataType: entry.dataType,
            resourceId: entry.resourceId,
            userAgent: entry.userAgent,
            sessionId: entry.sessionId
          }),
          user_id: entry.userId,
          tenant_id: entry.tenantId,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent
        });
    } catch (error) {
      console.error('Failed to send audit entry to server:', error);
    }
  }

  private async openAuditDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecurityAuditDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('audit_logs')) {
          const store = db.createObjectStore('audit_logs', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp', { unique: false });
          store.createIndex('by-user', 'userId', { unique: false });
          store.createIndex('by-type', 'type', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('security_alerts')) {
          const alertStore = db.createObjectStore('security_alerts', { keyPath: 'id' });
          alertStore.createIndex('by-timestamp', 'timestamp', { unique: false });
          alertStore.createIndex('by-severity', 'severity', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('failed_logins')) {
          const loginStore = db.createObjectStore('failed_logins', { keyPath: 'id' });
          loginStore.createIndex('by-email', 'email', { unique: false });
          loginStore.createIndex('by-timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async storeAlert(alert: SecurityAlert): Promise<void> {
    try {
      const db = await this.openAuditDB();
      const transaction = db.transaction(['security_alerts'], 'readwrite');
      const store = transaction.objectStore('security_alerts');
      await store.add({ ...alert, id: crypto.randomUUID() });
    } catch (error) {
      console.error('Failed to store security alert:', error);
    }
  }

  private async storeFailedLogin(email: string, reason: string): Promise<void> {
    try {
      const db = await this.openAuditDB();
      const transaction = db.transaction(['failed_logins'], 'readwrite');
      const store = transaction.objectStore('failed_logins');
      await store.add({
        id: crypto.randomUUID(),
        email,
        reason,
        timestamp: Date.now(),
        ipAddress: await this.getClientIP()
      });
    } catch (error) {
      console.error('Failed to store failed login:', error);
    }
  }

  private async getFailedLoginCount(email: string, timeWindow: number): Promise<number> {
    try {
      const db = await this.openAuditDB();
      const transaction = db.transaction(['failed_logins'], 'readonly');
      const store = transaction.objectStore('failed_logins');
      const index = store.index('by-email');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(email);
        request.onsuccess = () => {
          const now = Date.now();
          const recentAttempts = request.result.filter(
            attempt => (now - attempt.timestamp) < timeWindow
          );
          resolve(recentAttempts.length);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return 0;
    }
  }
}

export const securityMonitor = SecurityMonitor.getInstance();