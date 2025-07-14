
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface SetupResult {
  success: boolean;
  error?: string;
  tenant_id?: string;
  user_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  tenants: Tenant[];
  activeTenant: Tenant | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, tenantName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setActiveTenant: (tenant: Tenant) => void;
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

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_authenticated_user_data');
      
      if (error) {
        console.error('Error loading user data:', error);
        return;
      }

      const userData = data as UserData;
      
      if (userData?.authenticated && userData?.tenants) {
        setTenants(userData.tenants);
        // Set first active tenant as default
        const firstActiveTenant = userData.tenants.find((t: Tenant) => t.active);
        if (firstActiveTenant && !activeTenant) {
          setActiveTenant(firstActiveTenant);
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

  const signUp = async (email: string, password: string, fullName: string, tenantName: string) => {
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

        const result = setupResult as SetupResult;

        if (setupError || !result?.success) {
          console.error('Setup error:', setupError || result?.error);
          toast.error('Erro ao configurar organização: ' + (result?.error || setupError?.message));
          return { error: setupError || new Error(result?.error) };
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
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        tenants,
        activeTenant,
        signIn,
        signUp,
        signOut,
        setActiveTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
