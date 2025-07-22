
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FilterOption } from "@/types/filterTypes";

export const useFilterData = () => {
  const { activeTenant } = useAuth();

  // Buscar vendedores para filtro
  const {
    data: vendedorOptions = [],
    isLoading: loadingVendedores,
  } = useQuery({
    queryKey: ["filter-vendedores", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          tenant_users!inner(
            tenant_id,
            active
          )
        `)
        .eq("tenant_users.tenant_id", activeTenant.tenant_id)
        .eq("tenant_users.active", true);

      if (error) throw error;

      return data?.map((profile): FilterOption => ({
        value: profile.id,
        label: profile.full_name || "Sem nome",
      })) || [];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Buscar escritórios para filtro
  const {
    data: escritorioOptions = [],
    isLoading: loadingEscritorios,
  } = useQuery({
    queryKey: ["filter-escritorios", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from("offices")
        .select("id, name")
        .eq("tenant_id", activeTenant.tenant_id)
        .eq("active", true);

      if (error) throw error;

      return data?.map((office): FilterOption => ({
        value: office.id,
        label: office.name,
      })) || [];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Opções de mês
  const mesOptions: FilterOption[] = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  // Opções de ano (últimos 5 anos + próximos 2)
  const currentYear = new Date().getFullYear();
  const anoOptions: FilterOption[] = Array.from({ length: 7 }, (_, i) => {
    const year = currentYear - 4 + i;
    return {
      value: year.toString(),
      label: year.toString(),
    };
  });

  return {
    vendedorOptions,
    escritorioOptions,
    mesOptions,
    anoOptions,
    isLoading: loadingVendedores || loadingEscritorios,
  };
};
