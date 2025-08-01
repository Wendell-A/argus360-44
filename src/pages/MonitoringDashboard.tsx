import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecurityMonitoring, useRealTimeAlerts, usePerformanceMetrics } from '@/hooks/useSecurityMonitoring';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Database, 
  Wifi, 
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';

export const MonitoringDashboard: React.FC = () => {
  const { 
    securityData, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring,
    acknowledgeAlert,
    resolveAlert 
  } = useSecurityMonitoring();
  
  const { alerts: realtimeAlerts, dismissAlert } = useRealTimeAlerts();
  const { metrics: performanceMetrics } = usePerformanceMetrics();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security & Performance Monitoring</h1>
          <p className="text-muted-foreground">Real-time system monitoring and alerting</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isMonitoring ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {realtimeAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-red-600">🚨 Active Alerts</h2>
          {realtimeAlerts.map(alert => (
            <Alert key={alert.id} className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>
                  <Badge variant={getSeverityColor(alert.severity)} className="mr-2">
                    {alert.severity}
                  </Badge>
                  {alert.message}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => dismissAlert(alert.id)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* System Status Overview */}
      {securityData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityData.securityScore}/100</div>
              <Progress value={securityData.securityScore} className="mt-2" />
              <p className={`text-xs mt-1 ${getThreatLevelColor(securityData.threatLevel)}`}>
                Threat Level: {securityData.threatLevel}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {securityData.metrics.cacheMetrics.hitRate.toFixed(1)}%
              </div>
              <Progress value={securityData.metrics.cacheMetrics.hitRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Target: 70%+
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(securityData.metrics.dbMetrics.avgQueryTime)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Target: &lt;200ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sync Success Rate</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {securityData.metrics.offlineMetrics.syncSuccessRate.toFixed(1)}%
              </div>
              <Progress value={securityData.metrics.offlineMetrics.syncSuccessRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Target: 98%+
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Monitoring */}
      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          {securityData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Metrics</CardTitle>
                  <CardDescription>Real-time security monitoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Cross-Tenant Attempts</span>
                    <Badge variant={securityData.metrics.securityMetrics.crossTenantAttempts > 0 ? 'destructive' : 'secondary'}>
                      {securityData.metrics.securityMetrics.crossTenantAttempts}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Data Exposures</span>
                    <Badge variant={securityData.metrics.securityMetrics.sensitiveDataExposures > 0 ? 'destructive' : 'secondary'}>
                      {securityData.metrics.securityMetrics.sensitiveDataExposures}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SQL Injection Attempts</span>
                    <Badge variant={securityData.metrics.securityMetrics.sqlInjectionAttempts > 0 ? 'destructive' : 'secondary'}>
                      {securityData.metrics.securityMetrics.sqlInjectionAttempts}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Auth Failures</span>
                    <Badge variant={securityData.metrics.securityMetrics.authFailures > 5 ? 'destructive' : 'secondary'}>
                      {securityData.metrics.securityMetrics.authFailures}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Encryption Failures</span>
                    <Badge variant={securityData.metrics.securityMetrics.encryptionFailures > 0 ? 'destructive' : 'secondary'}>
                      {securityData.metrics.securityMetrics.encryptionFailures}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Threat Analysis</CardTitle>
                  <CardDescription>Security score breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Overall Security</span>
                        <span className={getThreatLevelColor(securityData.threatLevel)}>
                          {securityData.threatLevel}
                        </span>
                      </div>
                      <Progress value={securityData.securityScore} className="mt-1" />
                    </div>
                    
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        {securityData.metrics.securityMetrics.crossTenantAttempts === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>Tenant Isolation</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {securityData.metrics.securityMetrics.sensitiveDataExposures === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>Data Protection</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {securityData.metrics.cacheMetrics.tenantIsolationViolations === 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>Cache Security</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {securityData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Database Performance</CardTitle>
                  <CardDescription>Query execution metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Average Query Time</span>
                    <span className="font-mono">
                      {formatDuration(securityData.metrics.dbMetrics.avgQueryTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Slow Queries (&gt;1s)</span>
                    <Badge variant={securityData.metrics.dbMetrics.slowQueries.length > 0 ? 'destructive' : 'secondary'}>
                      {securityData.metrics.dbMetrics.slowQueries.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Index Hit Rate</span>
                    <span className="font-mono">
                      {securityData.metrics.dbMetrics.indexHitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Connection Pool Usage</span>
                    <span className="font-mono">
                      {securityData.metrics.dbMetrics.connectionPoolUsage.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Offline & Sync</CardTitle>
                  <CardDescription>Background synchronization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Sync Success Rate</span>
                    <span className="font-mono">
                      {securityData.metrics.offlineMetrics.syncSuccessRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Queued Operations</span>
                    <Badge variant={securityData.metrics.offlineMetrics.offlineOperationsQueued > 50 ? 'destructive' : 'secondary'}>
                      {securityData.metrics.offlineMetrics.offlineOperationsQueued}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Sync Time</span>
                    <span className="font-mono">
                      {formatDuration(securityData.metrics.offlineMetrics.avgSyncTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Storage Usage</span>
                    <span className="font-mono">
                      {formatBytes(securityData.metrics.offlineMetrics.storageUsage * 1024 * 1024)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          {securityData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Performance</CardTitle>
                  <CardDescription>Cache hit rates and efficiency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hit Rate</span>
                      <span>{securityData.metrics.cacheMetrics.hitRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={securityData.metrics.cacheMetrics.hitRate} />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Miss Latency</span>
                    <span className="font-mono">
                      {formatDuration(securityData.metrics.cacheMetrics.missLatency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Eviction Rate</span>
                    <span className="font-mono">
                      {securityData.metrics.cacheMetrics.evictionRate.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Memory Usage</span>
                    <span className="font-mono">
                      {formatBytes(securityData.metrics.cacheMetrics.memoryUsage * 1024 * 1024)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Security</CardTitle>
                  <CardDescription>Security and encryption metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Encryption Overhead</span>
                    <span className="font-mono">
                      {formatDuration(securityData.metrics.cacheMetrics.encryptionOverhead)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Tenant Violations</span>
                    <Badge variant={securityData.metrics.cacheMetrics.tenantIsolationViolations > 0 ? 'destructive' : 'secondary'}>
                      {securityData.metrics.cacheMetrics.tenantIsolationViolations}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {securityData.metrics.cacheMetrics.tenantIsolationViolations === 0 ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Tenant isolation secure</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Isolation violations detected</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {securityData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Alerts ({securityData.alerts.length})</CardTitle>
                  <CardDescription>Alerts requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {securityData.alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">No active alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {securityData.alerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <div>
                              <p className="font-medium">{alert.rule}</p>
                              <p className="text-sm text-muted-foreground">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!alert.acknowledged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;