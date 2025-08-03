/**
 * Componente de Filtros Simplificados do Dashboard
 * Data: 03 de Agosto de 2025, 14:02 UTC
 * 
 * Filtros simplificados com opções pré-definidas para melhor usabilidade
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, Building, Users } from 'lucide-react';

interface DashboardSimpleFiltersProps {
  onPeriodChange: (period: string) => void;
  onOfficeChange: (office: string) => void;
  selectedPeriod: string;
  selectedOffice: string;
  offices: Array<{ id: string; name: string }>;
}

export const DashboardSimpleFilters: React.FC<DashboardSimpleFiltersProps> = ({
  onPeriodChange,
  onOfficeChange,
  selectedPeriod,
  selectedOffice,
  offices
}) => {
  const predefinedPeriods = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mês' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Este Ano' },
    { value: 'all', label: 'Todos os Períodos' }
  ];

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {predefinedPeriods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => onPeriodChange(period.value)}
                className="text-xs"
              >
                {period.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedOffice} onValueChange={onOfficeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os Escritórios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Escritórios</SelectItem>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};