import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDashboardFiltersStore } from '@/stores/useDashboardFiltersStore';
import { useOffices } from '@/hooks/useOffices';
import { useConsortiumProducts } from '@/hooks/useConsortiumProducts';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

export function DashboardFilterModal({
  isOpen,
  onClose,
  onApply,
}: DashboardFilterModalProps) {
  const {
    filters,
    setYear,
    setMonth,
    setStartDate,
    setEndDate,
    setOfficeIds,
    setProductIds,
    resetFilters,
  } = useDashboardFiltersStore();

  const { offices } = useOffices();
  const { products } = useConsortiumProducts();

  // Anos disponíveis (últimos 5 anos + ano atual)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Meses
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    onClose();
  };

  const toggleOffice = (officeId: string) => {
    const newIds = filters.officeIds.includes(officeId)
      ? filters.officeIds.filter((id) => id !== officeId)
      : [...filters.officeIds, officeId];
    setOfficeIds(newIds);
  };

  const toggleProduct = (productId: string) => {
    const newIds = filters.productIds.includes(productId)
      ? filters.productIds.filter((id) => id !== productId)
      : [...filters.productIds, productId];
    setProductIds(newIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Filtros do Dashboard</DialogTitle>
          <DialogDescription>
            Selecione os filtros para refinar a visualização dos dados
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Período - Ano e Mês */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Período</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Select
                    value={filters.year?.toString() || ''}
                    onValueChange={(value) =>
                      setYear(value ? parseInt(value) : null)
                    }
                  >
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Mês</Label>
                  <Select
                    value={filters.month?.toString() || ''}
                    onValueChange={(value) =>
                      setMonth(value ? parseInt(value) : null)
                    }
                  >
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Período - Datas Específicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Período Personalizado</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? (
                          format(filters.startDate, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate || undefined}
                        onSelect={(date) => setStartDate(date || null)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? (
                          format(filters.endDate, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate || undefined}
                        onSelect={(date) => setEndDate(date || null)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Escritórios */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Escritórios</h3>
              <ScrollArea className="h-40 border rounded-md p-4">
                <div className="space-y-3">
                  {offices.map((office) => (
                    <div key={office.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`office-${office.id}`}
                        checked={filters.officeIds.includes(office.id)}
                        onCheckedChange={() => toggleOffice(office.id)}
                      />
                      <Label
                        htmlFor={`office-${office.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {office.name}
                      </Label>
                    </div>
                  ))}
                  {offices.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum escritório cadastrado
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Produtos */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Produtos</h3>
              <ScrollArea className="h-40 border rounded-md p-4">
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={filters.productIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      <Label
                        htmlFor={`product-${product.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {product.name}
                      </Label>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum produto cadastrado
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Limpar Filtros
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
