
import { useState, useMemo } from 'react';
import { BaseFilters } from "@/types/filterTypes";

interface UseAdvancedFiltersProps<T> {
  data: T[];
  itemsPerPage?: number;
  searchTerm?: string;
  searchFn?: (item: T, searchTerm: string) => boolean;
  filterFn?: (item: T, filters: BaseFilters) => boolean;
}

interface UseAdvancedFiltersReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  filteredData: T[];
  setCurrentPage: (page: number) => void;
  handleSearch: (term: string) => void;
  filters: BaseFilters;
  setFilters: (filters: BaseFilters) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  startIndex: number;
  endIndex: number;
}

export function useAdvancedFilters<T>({
  data,
  itemsPerPage = 10,
  searchTerm = '',
  searchFn,
  filterFn
}: UseAdvancedFiltersProps<T>): UseAdvancedFiltersReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<BaseFilters>({});

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== undefined && value !== '' && value !== null
    );
  }, [filters]);

  // Aplicar busca e filtros
  const filteredData = useMemo(() => {
    let result = data;

    // Aplicar busca por termo
    if (searchTerm && searchFn) {
      result = result.filter(item => searchFn(item, searchTerm));
    }

    // Aplicar filtros
    if (hasActiveFilters && filterFn) {
      result = result.filter(item => filterFn(item, filters));
    }

    return result;
  }, [data, searchTerm, searchFn, filters, hasActiveFilters, filterFn]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, startIndex, itemsPerPage]);

  // Resetar página quando busca ou filtros mudam
  const handleSearch = (term: string) => {
    setCurrentPage(1);
  };

  const handleSetFilters = (newFilters: BaseFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Garantir que a página atual é válida
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    filteredData,
    setCurrentPage,
    handleSearch,
    filters,
    setFilters: handleSetFilters,
    clearFilters,
    hasActiveFilters,
    startIndex,
    endIndex
  };
}
