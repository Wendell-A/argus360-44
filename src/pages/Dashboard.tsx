
import React, { useState } from 'react';
import { ConfigurableDashboard } from '@/components/ConfigurableDashboard';
import { useDashboardConfigurations } from '@/hooks/useDashboardPersonalization';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardFilterModal } from '@/components/dashboard/DashboardFilterModal';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { useDashboardFiltersStore } from '@/stores/useDashboardFiltersStore';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: configurations, isLoading } = useDashboardConfigurations();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { applyFilters, hasActiveFilters, isActive } = useDashboardFiltersStore();

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

  const handleApplyFilters = () => {
    console.log('📊 [Dashboard] handleApplyFilters chamado');
    applyFilters();
    setIsFilterModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Cabeçalho com Filtros */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {isActive && (
            <span className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium flex items-center gap-2">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              Dados Filtrados
            </span>
          )}
        </div>
        <Button
          variant={hasActiveFilters() ? "default" : "outline"}
          size="sm"
          onClick={() => setIsFilterModalOpen(true)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {hasActiveFilters() && !isActive && (
            <span className="ml-2 bg-yellow-500 text-white rounded-full px-2 py-0.5 text-xs">
              Pendentes
            </span>
          )}
        </Button>
      </div>

      {/* Dashboard Configurável */}
      <ConfigurableDashboard />

      {/* Modal de Filtros */}
      <DashboardFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
}

