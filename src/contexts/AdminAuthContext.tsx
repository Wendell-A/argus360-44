import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SuperAdmin {
  id: string;
  email: string;
  full_name: string;
}

interface AdminAuthContextType {
  superAdmin: SuperAdmin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isAuthenticated = !!superAdmin;

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('validate_super_admin_session', {
        p_token: token
      });

      const result = data as any;
      if (error || !result?.success) {
        localStorage.removeItem('super_admin_token');
        setSuperAdmin(null);
      } else {
        setSuperAdmin(result.admin);
      }
    } catch (error) {
      console.error('Error validating session:', error);
      localStorage.removeItem('super_admin_token');
      setSuperAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('authenticate_super_admin', {
        p_email: email,
        p_password: password
      });

      if (error) {
        toast.error('Erro ao fazer login: ' + error.message);
        return { error };
      }

      const result = data as any;
      if (result?.success) {
        localStorage.setItem('super_admin_token', result.token);
        setSuperAdmin(result.admin);
        toast.success('Login administrativo realizado com sucesso!');
        return { error: null };
      } else {
        toast.error(result?.error || 'Credenciais inválidas');
        return { error: new Error(result?.error || 'Credenciais inválidas') };
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('super_admin_token');
    setSuperAdmin(null);
    toast.success('Logout administrativo realizado com sucesso!');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        superAdmin,
        loading,
        signIn,
        signOut,
        isAuthenticated,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};