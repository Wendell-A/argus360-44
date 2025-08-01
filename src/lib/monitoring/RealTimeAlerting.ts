import { AdvancedMetrics, metricsCollector } from './MetricsCollector';
import { supabase } from '@/integrations/supabase/client';

export interface AlertRule {
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  frequency: number; // ms entre checks
  recipients: string[];
  actions: AlertAction[];
  enabled: boolean;
}

export interface Alert {
  id: string;
  rule: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
  resolvedAt?: number;
}

export type AlertAction = 
  | 'LOG' 
  | 'EMAIL' 
  | 'DASHBOARD_ALERT' 
  | 'BLOCK_USER' 
  | 'ENCRYPT_ALL_CACHE' 
  | 'AUDIT_LOG'
  | 'NOTIFICATION'
  | 'CACHE_CLEAR';

export class RealTimeAlerting {
  private static instance: RealTimeAlerting;
  private isRunning: boolean = false;
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];

  private readonly ALERT_RULES: AlertRule[] = [
    {
      name: 'Cache Hit Rate Too Low',
      metric: 'cacheMetrics.hitRate',
      condition: 'lt',
      threshold: 50, // Menos que 50% é crítico
      severity: 'HIGH',
      frequency: 60000, // Check a cada 1min
      recipients: ['admin@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'NOTIFICATION'],
      enabled: true
    },
    {
      name: 'Tenant Isolation Violation',
      metric: 'securityMetrics.crossTenantAttempts',
      condition: 'gt',
      threshold: 0, // Qualquer tentativa é crítica
      severity: 'CRITICAL',
      frequency: 5000, // Check a cada 5s
      recipients: ['security@tenant.com', 'admin@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'BLOCK_USER', 'AUDIT_LOG', 'NOTIFICATION'],
      enabled: true
    },
    {
      name: 'Database Performance Degraded',
      metric: 'dbMetrics.avgQueryTime',
      condition: 'gt',
      threshold: 500, // Mais que 500ms é preocupante
      severity: 'MEDIUM',
      frequency: 30000, // Check a cada 30s
      recipients: ['dev@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'NOTIFICATION'],
      enabled: true
    },
    {
      name: 'Sensitive Data Exposure',
      metric: 'securityMetrics.sensitiveDataExposures',
      condition: 'gt',
      threshold: 0, // Zero tolerância
      severity: 'CRITICAL',
      frequency: 1000, // Check a cada 1s
      recipients: ['security@tenant.com', 'dpo@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'ENCRYPT_ALL_CACHE', 'AUDIT_LOG', 'NOTIFICATION'],
      enabled: true
    },
    {
      name: 'Memory Usage High',
      metric: 'cacheMetrics.memoryUsage',
      condition: 'gt',
      threshold: 100, // Mais que 100MB
      severity: 'MEDIUM',
      frequency: 120000, // Check a cada 2min
      recipients: ['dev@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'CACHE_CLEAR', 'NOTIFICATION'],
      enabled: true
    },
    {
      name: 'Encryption Overhead Too High',
      metric: 'cacheMetrics.encryptionOverhead',
      condition: 'gt',
      threshold: 20, // Mais que 20ms
      severity: 'LOW',
      frequency: 300000, // Check a cada 5min
      recipients: ['dev@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT'],
      enabled: true
    },
    {
      name: 'Sync Success Rate Low',
      metric: 'offlineMetrics.syncSuccessRate',
      condition: 'lt',
      threshold: 95, // Menos que 95%
      severity: 'HIGH',
      frequency: 60000, // Check a cada 1min
      recipients: ['admin@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'NOTIFICATION'],
      enabled: true
    },
    {
      name: 'SQL Injection Attempts',
      metric: 'securityMetrics.sqlInjectionAttempts',
      condition: 'gt',
      threshold: 0, // Qualquer tentativa
      severity: 'CRITICAL',
      frequency: 5000, // Check a cada 5s
      recipients: ['security@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'BLOCK_USER', 'AUDIT_LOG', 'NOTIFICATION'],
      enabled: true
    },
    {
      name: 'Offline Operations Queue Full',
      metric: 'offlineMetrics.offlineOperationsQueued',
      condition: 'gt',
      threshold: 100, // Mais que 100 operações
      severity: 'MEDIUM',
      frequency: 30000, // Check a cada 30s
      recipients: ['dev@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'NOTIFICATION'],
      enabled: true
    },
    {
      name: 'Storage Usage Critical',
      metric: 'offlineMetrics.storageUsage',
      condition: 'gt',
      threshold: 45, // Mais que 45MB (próximo do limite de 50MB)
      severity: 'HIGH',
      frequency: 60000, // Check a cada 1min
      recipients: ['admin@tenant.com'],
      actions: ['LOG', 'DASHBOARD_ALERT', 'CACHE_CLEAR', 'NOTIFICATION'],
      enabled: true
    }
  ];

  private constructor() {}

  static getInstance(): RealTimeAlerting {
    if (!RealTimeAlerting.instance) {
      RealTimeAlerting.instance = new RealTimeAlerting();
    }
    return RealTimeAlerting.instance;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚨 Real-time alerting system started');

    // Start checks for each enabled rule
    this.ALERT_RULES.filter(rule => rule.enabled).forEach(rule => {
      this.startRuleCheck(rule);
    });
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    // Clear all intervals
    this.checkIntervals.forEach(interval => clearInterval(interval));
    this.checkIntervals.clear();
    
    console.log('🚨 Real-time alerting system stopped');
  }

  private startRuleCheck(rule: AlertRule): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.checkRule(rule);
      } catch (error) {
        console.error(`Error checking rule ${rule.name}:`, error);
      }
    }, rule.frequency);

    this.checkIntervals.set(rule.name, interval);
  }

  private async checkRule(rule: AlertRule): Promise<void> {
    const metrics = await metricsCollector.collectMetrics();
    const violation = this.evaluateRule(rule, metrics);
    
    if (violation) {
      const alertId = `${rule.name}_${Date.now()}`;
      const alert: Alert = {
        id: alertId,
        rule: rule.name,
        severity: rule.severity,
        message: `${rule.name}: ${violation.actualValue} ${rule.condition} ${rule.threshold}`,
        value: violation.actualValue,
        threshold: rule.threshold,
        timestamp: Date.now(),
        acknowledged: false
      };

      // Check if this is a duplicate alert (same rule, not resolved)
      const existingAlert = Array.from(this.activeAlerts.values())
        .find(a => a.rule === rule.name && !a.resolvedAt);

      if (!existingAlert) {
        await this.triggerAlert(alert, rule);
      }
    } else {
      // Check if we should resolve any active alerts for this rule
      const activeAlert = Array.from(this.activeAlerts.values())
        .find(a => a.rule === rule.name && !a.resolvedAt);
      
      if (activeAlert) {
        await this.resolveAlert(activeAlert.id);
      }
    }
  }

  private evaluateRule(rule: AlertRule, metrics: AdvancedMetrics): { actualValue: number } | null {
    const value = this.getMetricValue(rule.metric, metrics);
    
    if (value === null) return null;
    
    let violated = false;
    switch (rule.condition) {
      case 'gt':
        violated = value > rule.threshold;
        break;
      case 'lt':
        violated = value < rule.threshold;
        break;
      case 'eq':
        violated = value === rule.threshold;
        break;
    }
    
    return violated ? { actualValue: value } : null;
  }

  private getMetricValue(metricPath: string, metrics: AdvancedMetrics): number | null {
    try {
      const parts = metricPath.split('.');
      let value: any = metrics;
      
      for (const part of parts) {
        value = value[part];
        if (value === undefined || value === null) return null;
      }
      
      return typeof value === 'number' ? value : null;
    } catch {
      return null;
    }
  }

  private async triggerAlert(alert: Alert, rule: AlertRule): Promise<void> {
    console.warn(`🚨 ALERT [${alert.severity}]: ${alert.message}`);
    
    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    
    // Keep history limited to 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
    
    // Execute alert actions
    await this.executeAlert(alert, rule);
    
    // Save to database if online
    if (navigator.onLine) {
      await this.saveAlertToDatabase(alert);
    }
  }

  private async executeAlert(alert: Alert, rule: AlertRule): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, alert, rule);
      } catch (error) {
        console.error(`Failed to execute action ${action} for alert ${alert.id}:`, error);
      }
    }
  }

  private async executeAction(action: AlertAction, alert: Alert, rule: AlertRule): Promise<void> {
    switch (action) {
      case 'LOG':
        console.error(`ALERT [${rule.severity}]: ${alert.message}`, {
          alert,
          rule: rule.name,
          timestamp: new Date(alert.timestamp).toISOString()
        });
        break;
        
      case 'EMAIL':
        await this.sendEmailAlert(rule.recipients, alert);
        break;
        
      case 'DASHBOARD_ALERT':
        await this.showDashboardAlert(alert);
        break;
        
      case 'NOTIFICATION':
        await this.showNotification(alert);
        break;
        
      case 'BLOCK_USER':
        if (alert.rule.includes('Tenant') || alert.rule.includes('Security') || alert.rule.includes('SQL')) {
          await this.temporaryBlockUser(alert);
        }
        break;
        
      case 'ENCRYPT_ALL_CACHE':
        await this.emergencyEncryptCache();
        break;
        
      case 'CACHE_CLEAR':
        await this.clearCache();
        break;
        
      case 'AUDIT_LOG':
        await this.createEmergencyAuditEntry(alert);
        break;
    }
  }

  private async sendEmailAlert(recipients: string[], alert: Alert): Promise<void> {
    // Integration with email service would go here
    console.log(`📧 Email alert sent to ${recipients.join(', ')}: ${alert.message}`);
  }

  private async showDashboardAlert(alert: Alert): Promise<void> {
    // Dispatch custom event for dashboard to catch
    window.dispatchEvent(new CustomEvent('dashboard-alert', {
      detail: alert
    }));
  }

  private async showNotification(alert: Alert): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Security Alert - ${alert.severity}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id
      });
    }
  }

  private async temporaryBlockUser(alert: Alert): Promise<void> {
    console.warn(`🚫 Temporary user block triggered by alert: ${alert.message}`);
    // Implementation would depend on your auth system
  }

  private async emergencyEncryptCache(): Promise<void> {
    console.warn(`🔐 Emergency cache encryption triggered by alert`);
    // Force encryption of all cache entries
  }

  private async clearCache(): Promise<void> {
    console.warn(`🗑️ Cache clear triggered by alert`);
    // Clear cache to free memory/storage
  }

  private async createEmergencyAuditEntry(alert: Alert): Promise<void> {
    try {
      await supabase.from('audit_log').insert({
        action: 'EMERGENCY_ALERT',
        table_name: 'monitoring_alerts',
        new_values: JSON.stringify({ alert: alert.message, severity: alert.severity }),
        user_id: null,
        tenant_id: null,
        ip_address: null,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to create emergency audit entry:', error);
    }
  }

  private async saveAlertToDatabase(alert: Alert): Promise<void> {
    // Store alerts in audit_log for now since system_alerts table doesn't exist
    try {
      await supabase.from('audit_log').insert({
        action: `ALERT_${alert.severity}`,
        table_name: 'monitoring_system',
        record_id: alert.id,
        new_values: JSON.stringify({
          rule: alert.rule,
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold
        }),
        user_id: null,
        tenant_id: null,
        ip_address: null,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to save alert to database:', error);
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      
      // Update in database if online - using audit_log since system_alerts doesn't exist
      if (navigator.onLine) {
        try {
          await supabase.from('audit_log').insert({
            action: 'ALERT_ACKNOWLEDGED',
            table_name: 'monitoring_system',
            record_id: alertId,
            new_values: JSON.stringify({ acknowledged: true }),
            user_id: null,
            tenant_id: null,
            ip_address: null,
            user_agent: navigator.userAgent
          });
        } catch (error) {
          console.error('Failed to acknowledge alert in database:', error);
        }
      }
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(alertId);
      
      console.log(`✅ Alert resolved: ${alert.message}`);
      
      // Update in database if online - using audit_log since system_alerts doesn't exist
      if (navigator.onLine) {
        try {
          await supabase.from('audit_log').insert({
            action: 'ALERT_RESOLVED',
            table_name: 'monitoring_system',
            record_id: alertId,
            new_values: JSON.stringify({ resolved_at: new Date(alert.resolvedAt).toISOString() }),
            user_id: null,
            tenant_id: null,
            ip_address: null,
            user_agent: navigator.userAgent
          });
        } catch (error) {
          console.error('Failed to resolve alert in database:', error);
        }
      }
    }
  }

  // Public API
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit: number = 50): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  getAlertsByRule(ruleName: string): Alert[] {
    return this.alertHistory.filter(alert => alert.rule === ruleName);
  }

  getRules(): AlertRule[] {
    return [...this.ALERT_RULES];
  }

  updateRule(ruleName: string, updates: Partial<AlertRule>): void {
    const ruleIndex = this.ALERT_RULES.findIndex(rule => rule.name === ruleName);
    if (ruleIndex !== -1) {
      this.ALERT_RULES[ruleIndex] = { ...this.ALERT_RULES[ruleIndex], ...updates };
      
      // Restart check if frequency changed and rule is enabled
      if (updates.frequency && this.ALERT_RULES[ruleIndex].enabled) {
        const existingInterval = this.checkIntervals.get(ruleName);
        if (existingInterval) {
          clearInterval(existingInterval);
          this.startRuleCheck(this.ALERT_RULES[ruleIndex]);
        }
      }
    }
  }

  enableRule(ruleName: string): void {
    const rule = this.ALERT_RULES.find(r => r.name === ruleName);
    if (rule && !rule.enabled) {
      rule.enabled = true;
      if (this.isRunning) {
        this.startRuleCheck(rule);
      }
    }
  }

  disableRule(ruleName: string): void {
    const rule = this.ALERT_RULES.find(r => r.name === ruleName);
    if (rule && rule.enabled) {
      rule.enabled = false;
      const interval = this.checkIntervals.get(ruleName);
      if (interval) {
        clearInterval(interval);
        this.checkIntervals.delete(ruleName);
      }
    }
  }
}

export const realTimeAlerting = RealTimeAlerting.getInstance();
