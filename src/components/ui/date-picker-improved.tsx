import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type CalendarImprovedProps = React.ComponentProps<typeof DayPicker>;

function CalendarImproved({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarImprovedProps) {
  const [month, setMonth] = React.useState<Date>(props.selected as Date || new Date());

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100; // 100 anos atrás
    const endYear = currentYear;
    
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  }, []);

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(month.getFullYear(), i, 1);
      return {
        value: i,
        label: format(date, 'MMMM', { locale: ptBR })
      };
    });
  }, [month]);

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month.getFullYear(), parseInt(monthIndex), 1);
    setMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(parseInt(year), month.getMonth(), 1);
    setMonth(newMonth);
  };

  return (
    <div className="space-y-4">
      {/* Navegação Rápida */}
      <div className="flex items-center justify-center gap-2 px-3">
        <Select value={month.getMonth().toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value.toString()}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={month.getFullYear().toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendário */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        month={month}
        onMonthChange={setMonth}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </div>
  );
}
CalendarImproved.displayName = "CalendarImproved";

interface DatePickerImprovedProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePickerImproved({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione uma data",
  minDate,
  maxDate,
}: DatePickerImprovedProps) {
  
  const handleDateChange = React.useCallback((date: Date | undefined) => {
    console.log('📅 [DEBUG] DatePickerImproved - onChange chamado:', {
      originalValue: value,
      newValue: date,
      newValueString: date ? date.toISOString() : 'undefined',
      newValueFormatted: date ? date.toLocaleDateString('pt-BR') : 'undefined',
      timestamp: new Date().toISOString()
    });
    
    if (onChange) {
      onChange(date);
    }
  }, [value, onChange]);

  // Log quando o valor é atualizado externamente
  React.useEffect(() => {
    console.log('🔄 [DEBUG] DatePickerImproved - valor atualizado:', {
      value: value,
      valueString: value ? value.toISOString() : 'undefined',
      valueFormatted: value ? value.toLocaleDateString('pt-BR') : 'undefined'
    });
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full pl-3 text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {value ? (
            <span className="flex items-center gap-2">
              {format(value, "dd/MM/yyyy", { locale: ptBR })}
              <span className="text-xs text-muted-foreground">
                ({Math.floor((new Date().getTime() - value.getTime()) / (1000 * 60 * 60 * 24 * 365))} anos)
              </span>
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b text-sm text-muted-foreground">
          {value ? (
            <div className="space-y-1">
              <div>Data selecionada: <span className="font-medium">{format(value, "dd/MM/yyyy", { locale: ptBR })}</span></div>
              <div>Idade atual: <span className="font-medium">{Math.floor((new Date().getTime() - value.getTime()) / (1000 * 60 * 60 * 24 * 365))} anos</span></div>
            </div>
          ) : (
            "Selecione uma data de nascimento"
          )}
        </div>
        <CalendarImproved
          mode="single"
          selected={value}
          onSelect={handleDateChange}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
          className="pointer-events-auto"
        />
        {value && (
          <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground">
            Formato ISO: {value.toISOString().split('T')[0]}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { CalendarImproved };