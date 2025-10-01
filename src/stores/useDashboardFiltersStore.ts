import { create } from 'zustand';

export interface DashboardFilters {
  year: number | null;
  month: number | null;
  startDate: Date | null;
  endDate: Date | null;
  officeIds: string[];
  productIds: string[];
}

interface DashboardFiltersStore {
  filters: DashboardFilters;
  isActive: boolean;
  setYear: (year: number | null) => void;
  setMonth: (month: number | null) => void;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  setOfficeIds: (ids: string[]) => void;
  setProductIds: (ids: string[]) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  hasActiveFilters: () => boolean;
}

const initialFilters: DashboardFilters = {
  year: null,
  month: null,
  startDate: null,
  endDate: null,
  officeIds: [],
  productIds: [],
};

export const useDashboardFiltersStore = create<DashboardFiltersStore>((set, get) => ({
  filters: initialFilters,
  isActive: false,

  setYear: (year) => set((state) => ({
    filters: { ...state.filters, year }
  })),

  setMonth: (month) => set((state) => ({
    filters: { ...state.filters, month }
  })),

  setStartDate: (startDate) => set((state) => ({
    filters: { ...state.filters, startDate }
  })),

  setEndDate: (endDate) => set((state) => ({
    filters: { ...state.filters, endDate }
  })),

  setOfficeIds: (officeIds) => set((state) => ({
    filters: { ...state.filters, officeIds }
  })),

  setProductIds: (productIds) => set((state) => ({
    filters: { ...state.filters, productIds }
  })),

  resetFilters: () => set({
    filters: initialFilters,
    isActive: false,
  }),

  applyFilters: () => set({ isActive: true }),

  hasActiveFilters: () => {
    const { filters } = get();
    return !!(
      filters.year ||
      filters.month ||
      filters.startDate ||
      filters.endDate ||
      filters.officeIds.length > 0 ||
      filters.productIds.length > 0
    );
  },
}));
