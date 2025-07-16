
import { useState, useMemo } from 'react';

interface UsePaginatedQueryProps<T> {
  data: T[];
  itemsPerPage?: number;
  searchTerm?: string;
  searchFn?: (item: T, searchTerm: string) => boolean;
}

interface UsePaginatedQueryReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  filteredData: T[];
  setCurrentPage: (page: number) => void;
  handleSearch: (term: string) => void;
  startIndex: number;
  endIndex: number;
}

export function usePaginatedQuery<T>({
  data,
  itemsPerPage = 10,
  searchTerm = '',
  searchFn
}: UsePaginatedQueryProps<T>): UsePaginatedQueryReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar dados baseado na busca
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchFn) return data;
    return data.filter(item => searchFn(item, searchTerm));
  }, [data, searchTerm, searchFn]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, startIndex, itemsPerPage]);

  // Resetar página quando busca muda
  const handleSearch = (term: string) => {
    setCurrentPage(1);
  };

  // Garantir que a página atual é válida
  React.useEffect(() => {
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
    startIndex,
    endIndex
  };
}
