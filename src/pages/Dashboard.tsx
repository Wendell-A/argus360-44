
import React, { useState } from 'react';
import { ConfigurableDashboard } from '@/components/ConfigurableDashboard';
import { useDashboardConfigurations } from '@/hooks/useDashboardPersonalization';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: configurations, isLoading } = useDashboardConfigurations();

  // Verificar se existem configurações personalizadas
  const hasConfigurations = configurations && configurations.length > 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Dashboard Configurável */}
      <ConfigurableDashboard />
    </div>
  );
}

