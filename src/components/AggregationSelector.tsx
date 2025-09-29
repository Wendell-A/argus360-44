import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { useAggregationOptions, AggregationOption } from '@/hooks/useAggregationOptions';
import { AggregationFilter } from '@/hooks/useDashboardPersonalization';

interface AggregationSelectorProps {
  type: 'products' | 'offices' | 'sellers';
  value?: AggregationFilter;
  onChange: (filter: AggregationFilter | undefined) => void;
  label: string;
}

export function AggregationSelector({ type, value, onChange, label }: AggregationSelectorProps) {
  const { products, offices, sellers, isLoading } = useAggregationOptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(value?.selectedIds || []);
  const [useOthers, setUseOthers] = useState(value?.type === 'others');
  const [otherLabel, setOtherLabel] = useState(value?.otherLabel || `Outros ${label}`);
  const [enabled, setEnabled] = useState(!!value);

  // Obter opções corretas baseado no tipo
  const options = type === 'products' ? products : type === 'offices' ? offices : sellers;

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Atualizar valor quando mudanças internas ocorrem
  useEffect(() => {
    if (!enabled) {
      onChange(undefined);
      return;
    }

    if (useOthers) {
      onChange({
        type: 'others',
        otherLabel,
      });
    } else if (selectedIds.length > 0) {
      onChange({
        type: 'specific',
        selectedIds,
      });
    } else {
      onChange(undefined);
    }
  }, [enabled, useOthers, selectedIds, otherLabel, onChange]);

  const handleItemToggle = (itemId: string) => {
    setSelectedIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredOptions.map(option => option.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const selectedOptions = options.filter(option => selectedIds.includes(option.id));

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </CardHeader>
      
      {enabled && (
        <CardContent className="space-y-4">
          {/* Modo "Outros" */}
          <div className="flex items-center space-x-2">
            <Switch
              id={`others-${type}`}
              checked={useOthers}
              onCheckedChange={setUseOthers}
            />
            <Label htmlFor={`others-${type}`} className="text-sm">
              Agrupar como "Outros"
            </Label>
          </div>

          {useOthers ? (
            <div className="space-y-2">
              <Label htmlFor={`others-label-${type}`} className="text-sm">
                Rótulo para "Outros"
              </Label>
              <Input
                id={`others-label-${type}`}
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
                placeholder={`Outros ${label}`}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Buscar ${label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Ações rápidas */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isLoading}
                >
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={selectedIds.length === 0}
                >
                  Limpar
                </Button>
              </div>

              {/* Itens selecionados */}
              {selectedOptions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Selecionados ({selectedOptions.length})
                  </Label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {selectedOptions.map(option => (
                      <Badge
                        key={option.id}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleItemToggle(option.id)}
                      >
                        {option.name}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Lista de opções */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : filteredOptions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {searchTerm ? 'Nenhum resultado encontrado' : `Nenhum ${label.toLowerCase()} disponível`}
                  </div>
                ) : (
                  filteredOptions.map(option => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${type}-${option.id}`}
                        checked={selectedIds.includes(option.id)}
                        onCheckedChange={() => handleItemToggle(option.id)}
                      />
                      <Label
                        htmlFor={`${type}-${option.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {option.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {enabled && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <Label className="text-xs font-medium text-muted-foreground">
                Preview da Agregação:
              </Label>
              <div className="text-sm mt-1">
                {useOthers ? (
                  `Top 5 ${label.toLowerCase()} + "${otherLabel}"`
                ) : selectedIds.length > 0 ? (
                  `${selectedIds.length} ${label.toLowerCase()} específicos`
                ) : (
                  `Todos os ${label.toLowerCase()}`
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}