
import { useState, useCallback } from 'react';
import { rateLimiter } from '@/lib/rateLimit/RateLimiter';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useRateLimit = () => {
  const { user } = useAuth();
  const [isLimited, setIsLimited] = useState(false);

  const checkLimit = useCallback(async (limiterName: string) => {
    try {
      const result = await rateLimiter.checkLimit(limiterName, { userId: user?.id });
      
      if (!result.allowed) {
        const resetDate = new Date(result.resetTime);
        const minutes = Math.ceil((result.resetTime - Date.now()) / 60000);
        
        toast.error(`Limite de requisições excedido. Tente novamente em ${minutes} minuto(s).`);
        setIsLimited(true);
        
        // Reset após o tempo limite
        setTimeout(() => setIsLimited(false), result.resetTime - Date.now());
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Permitir em caso de erro
    }
  }, [user?.id]);

  return {
    checkLimit,
    isLimited
  };
};
