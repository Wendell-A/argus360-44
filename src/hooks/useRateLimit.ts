
/**
 * Hook Rate Limit Seguro - ETAPA 1
 * Data: 29 de Janeiro de 2025, 14:20 UTC
 * 
 * Hook melhorado com classificação de sensibilidade, isolamento por tenant
 * e monitoramento de segurança avançado.
 */

import { useState, useCallback } from 'react';
import { rateLimiter } from '@/lib/rateLimit/RateLimiter';
import { useAuth } from '@/contexts/AuthContext';
import { DataSensitivity } from '@/lib/security/DataClassification';
import { toast } from 'sonner';

interface RateLimitOptions {
  sensitivity?: DataSensitivity;
  showToast?: boolean;
  customMessage?: string;
}

export const useRateLimit = () => {
  const { user, activeTenant } = useAuth();
  const [isLimited, setIsLimited] = useState(false);
  const [securityScore, setSecurityScore] = useState(100);

  const checkLimit = useCallback(async (
    limiterName: string, 
    options: RateLimitOptions = {}
  ) => {
    const { 
      sensitivity = DataSensitivity.PUBLIC, 
      showToast = true,
      customMessage 
    } = options;

    try {
      // Selecionar limiter baseado na sensibilidade
      let actualLimiterName = limiterName;
      
      switch (sensitivity) {
        case DataSensitivity.CRITICAL:
          actualLimiterName = 'critical_operations';
          break;
        case DataSensitivity.PERSONAL:
          actualLimiterName = 'personal_data_access';
          break;
        case DataSensitivity.BUSINESS:
          actualLimiterName = 'api_calls';
          break;
        case DataSensitivity.PUBLIC:
          actualLimiterName = 'public_operations';
          break;
        default:
          actualLimiterName = limiterName;
      }

      const result = await rateLimiter.checkLimit(actualLimiterName, { 
        userId: user?.id,
        tenantId: activeTenant?.tenant_id
      });
      
      // Atualizar score de segurança
      setSecurityScore(result.securityScore);
      
      if (!result.allowed) {
        const resetDate = new Date(result.resetTime);
        const minutes = Math.ceil((result.resetTime - Date.now()) / 60000);
        
        const message = customMessage || 
          `Limite de ${getSensitivityLabel(sensitivity)} excedido. Tente novamente em ${minutes} minuto(s).`;
        
        if (showToast) {
          toast.error(message, {
            description: `Nível de sensibilidade: ${getSensitivityLabel(sensitivity)}`,
            action: {
              label: "Entendi",
              onClick: () => {}
            }
          });
        }
        
        setIsLimited(true);
        
        // Reset após o tempo limite
        setTimeout(() => setIsLimited(false), result.resetTime - Date.now());
        
        // Alertar sobre score de segurança baixo
        if (result.securityScore < 30) {
          console.error(`ALERTA DE SEGURANÇA: Score muito baixo (${result.securityScore}) para usuário ${user?.id}`);
          if (showToast) {
            toast.error("Atividade suspeita detectada", {
              description: "Sua conta pode estar comprometida. Contate o administrador.",
            });
          }
        }
        
        return {
          allowed: false,
          remaining: result.remaining,
          resetTime: result.resetTime,
          securityScore: result.securityScore,
          severity: getSeverityBySensitivity(sensitivity)
        };
      }
      
      return {
        allowed: true,
        remaining: result.remaining,
        resetTime: result.resetTime,
        securityScore: result.securityScore,
        severity: 'LOW' as const
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      
      // Falhar seguro: permitir em caso de erro, mas registrar
      if (showToast) {
        toast.error("Erro interno do sistema", {
          description: "Não foi possível verificar limites. Operação permitida."
        });
      }
      
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 60000,
        securityScore: 50, // Score neutro em caso de erro
        severity: 'MEDIUM' as const
      };
    }
  }, [user?.id, activeTenant?.tenant_id]);

  const checkCriticalLimit = useCallback((options?: RateLimitOptions) => {
    return checkLimit('critical_operations', { 
      ...options, 
      sensitivity: DataSensitivity.CRITICAL 
    });
  }, [checkLimit]);

  const checkPersonalDataLimit = useCallback((options?: RateLimitOptions) => {
    return checkLimit('personal_data_access', { 
      ...options, 
      sensitivity: DataSensitivity.PERSONAL 
    });
  }, [checkLimit]);

  const checkBusinessDataLimit = useCallback((options?: RateLimitOptions) => {
    return checkLimit('api_calls', { 
      ...options, 
      sensitivity: DataSensitivity.BUSINESS 
    });
  }, [checkLimit]);

  const checkExportLimit = useCallback((options?: RateLimitOptions) => {
    return checkLimit('exports', { 
      ...options, 
      sensitivity: DataSensitivity.BUSINESS 
    });
  }, [checkLimit]);

  return {
    checkLimit,
    checkCriticalLimit,
    checkPersonalDataLimit,
    checkBusinessDataLimit,
    checkExportLimit,
    isLimited,
    securityScore
  };
};

// Funções auxiliares
function getSensitivityLabel(sensitivity: DataSensitivity): string {
  switch (sensitivity) {
    case DataSensitivity.CRITICAL: return 'Operações Críticas';
    case DataSensitivity.PERSONAL: return 'Dados Pessoais';
    case DataSensitivity.BUSINESS: return 'Dados Comerciais';
    case DataSensitivity.PUBLIC: return 'Dados Públicos';
    default: return 'Desconhecido';
  }
}

function getSeverityBySensitivity(sensitivity: DataSensitivity): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  switch (sensitivity) {
    case DataSensitivity.CRITICAL: return 'CRITICAL';
    case DataSensitivity.PERSONAL: return 'HIGH';
    case DataSensitivity.BUSINESS: return 'MEDIUM';
    case DataSensitivity.PUBLIC: return 'LOW';
    default: return 'MEDIUM';
  }
}
