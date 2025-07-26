import { useMemo } from 'react';
import { useUserContext } from './useUserContext';
import { useContextualUsers } from './useContextualUsers';

export interface FilterOption {
  value: string;
  label: string;
}

export interface ContextualFilters {
  officeFilters: FilterOption[];
  userFilters: FilterOption[];
  canFilterByOffice: boolean;
  canFilterByUser: boolean;
  canSeeGlobalData: boolean;
  contextLevel: number;
}

export function useContextualFilters(): ContextualFilters {
  const { userContext, isLoading: isContextLoading } = useUserContext();
  const { data: contextualUsers, isLoading: isUsersLoading } = useContextualUsers(!isContextLoading);

  return useMemo(() => {
    if (isContextLoading || isUsersLoading || !userContext) {
      return {
        officeFilters: [],
        userFilters: [],
        canFilterByOffice: false,
        canFilterByUser: false,
        canSeeGlobalData: false,
        contextLevel: 4
      };
    }

    const isOwnerOrAdmin = userContext.is_owner_or_admin;
    const isManager = userContext.is_manager;
    const isUser = userContext.is_user;

    // Opções de filtro por escritório
    const officeFilters: FilterOption[] = userContext.accessible_offices?.map(officeId => ({
      value: officeId,
      label: `Escritório ${officeId.substring(0, 8)}...` // Temporário até termos nomes dos escritórios
    })) || [];

    // Opções de filtro por usuário (baseado nos usuários contextuais)
    const userFilters: FilterOption[] = contextualUsers?.map(user => ({
      value: user.user_id,
      label: `Usuário ${user.user_id.substring(0, 8)}...` // Temporário até termos nomes dos usuários
    })) || [];

    return {
      officeFilters,
      userFilters,
      canFilterByOffice: isOwnerOrAdmin || isManager,
      canFilterByUser: isOwnerOrAdmin || isManager,
      canSeeGlobalData: isOwnerOrAdmin,
      contextLevel: userContext.context_level
    };
  }, [userContext, contextualUsers, isContextLoading, isUsersLoading]);
}