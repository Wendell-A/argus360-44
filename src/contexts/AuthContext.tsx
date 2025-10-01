
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LgpdConsentModal } from '@/components/auth/LgpdConsentModal';

interface Tenant {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_status: string;
  user_role: string;
  active: boolean;
}

interface UserData {
  authenticated: boolean;
  user_id?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  tenants?: Tenant[];
  lgpd_accepted_at?: string;
  lgpd_version_accepted?: string;
}

interface SetupResult {
  success: boolean;
  error?: string;
  tenant_id?: string;
  user_id?: string;
}

interface OfficeData {
  cnpj: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contact: {
    phone: string;
    email: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  tenants: Tenant[];
  activeTenant: Tenant | null;
  showLgpdModal: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, tenantName: string, officeData?: OfficeData) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setActiveTenant: (tenant: Tenant) => void;
  acceptLgpdTerms: (version: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [showLgpdModal, setShowLgpdModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_authenticated_user_data');
      
      if (error) {
        console.error('Error loading user data:', error);
        return;
      }

      const userDataResponse = data as unknown as UserData;
      
      if (userDataResponse?.authenticated) {
        setUserData(userDataResponse);
        
        // Verificar se precisa mostrar modal LGPD
        setShowLgpdModal(!userDataResponse.lgpd_accepted_at);
        
        if (userDataResponse.tenants) {
          setTenants(userDataResponse.tenants);
          // Set first active tenant as default
          const firstActiveTenant = userDataResponse.tenants.find((t: Tenant) => t.active);
          if (firstActiveTenant && !activeTenant) {
            setActiveTenant(firstActiveTenant);
          }
        }
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadUserData();
          }, 0);
        } else {
          setTenants([]);
          setActiveTenant(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast.error('Erro ao fazer login: ' + error.message);
    } else {
      toast.success('Login realizado com sucesso!');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, tenantName: string, officeData?: OfficeData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      toast.error('Erro ao criar conta: ' + error.message);
      return { error };
    }

    if (data.user) {
      // Create initial tenant setup
      try {
        const tenantSlug = tenantName.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);

        console.log('Creating initial setup for user:', data.user.id);

        const { data: setupResult, error: setupError } = await supabase.rpc(
          'create_initial_user_setup',
          {
            user_id: data.user.id,
            user_email: email,
            user_full_name: fullName,
            tenant_name: tenantName,
            tenant_slug: tenantSlug
          }
        );

        const result = setupResult as unknown as SetupResult;

        if (setupError || !result?.success) {
          console.error('Setup error:', setupError || result?.error);
          toast.error('Erro ao configurar organização: ' + (result?.error || setupError?.message));
          return { error: setupError || new Error(result?.error) };
        }

        console.log('Setup successful, tenant_id:', result.tenant_id);

        // Se temos dados do escritório e o setup foi bem-sucedido, criar o escritório
        if (officeData && result.tenant_id) {
          console.log('Creating office for tenant:', result.tenant_id);
          
          const { data: officeResult, error: officeError } = await supabase
            .from('offices')
            .insert([{
              tenant_id: result.tenant_id,
              name: tenantName, // Herda o nome da empresa
              type: 'matriz',
              cnpj: officeData.cnpj,
              parent_office_id: null,
              address: officeData.address,
              contact: officeData.contact,
              active: true,
            }])
            .select()
            .single();

          if (officeError) {
            console.error('Error creating office:', officeError);
            toast.error('Escritório criado com problema: ' + officeError.message);
            // Não falhar o cadastro por causa do escritório
          } else {
            console.log('Office created successfully:', officeResult);
            
            // Criar associação do usuário com o escritório
            if (officeResult && result.user_id) {
              const { error: officeUserError } = await supabase
                .from('office_users')
                .insert([{
                  user_id: result.user_id,
                  office_id: officeResult.id,
                  tenant_id: result.tenant_id,
                  role: 'admin',
                  active: true,
                }]);

              if (officeUserError) {
                console.error('Error creating office user association:', officeUserError);
                toast.error('Erro ao associar usuário ao escritório: ' + officeUserError.message);
              } else {
                console.log('Office user association created successfully');
              }
            }
          }
        }

        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      } catch (setupError) {
        console.error('Setup exception:', setupError);
        toast.error('Erro ao configurar conta inicial');
        return { error: setupError };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTenants([]);
    setActiveTenant(null);
    setUserData(null);
    setShowLgpdModal(false);
    toast.success('Logout realizado com sucesso!');
  };

  const acceptLgpdTerms = async (version: string) => {
    const { error } = await supabase.rpc('accept_lgpd_terms', {
      terms_version: version
    });

    if (error) {
      console.error('Erro ao aceitar termos LGPD:', error);
      throw error;
    }

    // Atualizar estado local
    setUserData(prev => prev ? {
      ...prev,
      lgpd_accepted_at: new Date().toISOString(),
      lgpd_version_accepted: version,
    } : null);
    
    setShowLgpdModal(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        tenants,
        activeTenant,
        showLgpdModal,
        signIn,
        signUp,
        signOut,
        setActiveTenant,
        acceptLgpdTerms,
      }}
    >
      {children}
      {showLgpdModal && user && <LgpdConsentModal onAccept={acceptLgpdTerms} />}
    </AuthContext.Provider>
  );
};
