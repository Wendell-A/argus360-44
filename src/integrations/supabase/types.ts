export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: Json | null
          birth_date: string | null
          classification: string | null
          created_at: string | null
          document: string
          email: string | null
          id: string
          monthly_income: number | null
          name: string
          notes: string | null
          occupation: string | null
          office_id: string | null
          phone: string | null
          responsible_user_id: string | null
          secondary_phone: string | null
          settings: Json | null
          source: string | null
          status: string | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
          classification?: string | null
          created_at?: string | null
          document: string
          email?: string | null
          id?: string
          monthly_income?: number | null
          name: string
          notes?: string | null
          occupation?: string | null
          office_id?: string | null
          phone?: string | null
          responsible_user_id?: string | null
          secondary_phone?: string | null
          settings?: Json | null
          source?: string | null
          status?: string | null
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
          classification?: string | null
          created_at?: string | null
          document?: string
          email?: string | null
          id?: string
          monthly_income?: number | null
          name?: string
          notes?: string | null
          occupation?: string | null
          office_id?: string | null
          phone?: string | null
          responsible_user_id?: string | null
          secondary_phone?: string | null
          settings?: Json | null
          source?: string | null
          status?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          approval_date: string | null
          base_amount: number
          commission_amount: number
          commission_rate: number
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          recipient_id: string
          recipient_type: string
          sale_id: string
          settings: Json | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          base_amount: number
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          recipient_id: string
          recipient_type: string
          sale_id: string
          settings?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          base_amount?: number
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          recipient_id?: string
          recipient_type?: string
          sale_id?: string
          settings?: Json | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consortium_products: {
        Row: {
          administration_fee: number
          asset_value: number
          category: string
          commission_rate: number
          created_at: string | null
          description: string | null
          id: string
          installments: number
          min_down_payment: number | null
          monthly_fee: number
          name: string
          settings: Json | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          administration_fee: number
          asset_value: number
          category: string
          commission_rate: number
          created_at?: string | null
          description?: string | null
          id?: string
          installments: number
          min_down_payment?: number | null
          monthly_fee: number
          name: string
          settings?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          administration_fee?: number
          asset_value?: number
          category?: string
          commission_rate?: number
          created_at?: string | null
          description?: string | null
          id?: string
          installments?: number
          min_down_payment?: number | null
          monthly_fee?: number
          name?: string
          settings?: Json | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consortium_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      office_users: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          office_id: string
          role: Database["public"]["Enums"]["user_role"] | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          office_id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          office_id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_users_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          active: boolean | null
          address: Json | null
          cnpj: string | null
          contact: Json | null
          created_at: string | null
          id: string
          name: string
          parent_office_id: string | null
          responsible_id: string | null
          settings: Json | null
          tenant_id: string
          type: Database["public"]["Enums"]["office_type"] | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          active?: boolean | null
          address?: Json | null
          cnpj?: string | null
          contact?: Json | null
          created_at?: string | null
          id?: string
          name: string
          parent_office_id?: string | null
          responsible_id?: string | null
          settings?: Json | null
          tenant_id: string
          type?: Database["public"]["Enums"]["office_type"] | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          active?: boolean | null
          address?: Json | null
          cnpj?: string | null
          contact?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          parent_office_id?: string | null
          responsible_id?: string | null
          settings?: Json | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["office_type"] | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "offices_parent_office_id_fkey"
            columns: ["parent_office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          actions: string[]
          created_at: string | null
          id: string
          module: string
          resource: string
        }
        Insert: {
          actions: string[]
          created_at?: string | null
          id?: string
          module: string
          resource: string
        }
        Update: {
          actions?: string[]
          created_at?: string | null
          id?: string
          module?: string
          resource?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          department_id: string | null
          email: string
          full_name: string | null
          hierarchical_level: number | null
          hire_date: string | null
          id: string
          last_access: string | null
          phone: string | null
          position: string | null
          position_id: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          email: string
          full_name?: string | null
          hierarchical_level?: number | null
          hire_date?: string | null
          id: string
          last_access?: string | null
          phone?: string | null
          position?: string | null
          position_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          email?: string
          full_name?: string | null
          hierarchical_level?: number | null
          hire_date?: string | null
          id?: string
          last_access?: string | null
          phone?: string | null
          position?: string | null
          position_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          approval_date: string | null
          cancellation_date: string | null
          client_id: string
          commission_amount: number
          commission_rate: number
          completion_date: string | null
          contract_number: string | null
          created_at: string | null
          down_payment: number | null
          id: string
          installments: number
          monthly_payment: number
          notes: string | null
          office_id: string
          product_id: string
          sale_date: string
          sale_value: number
          seller_id: string
          settings: Json | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          cancellation_date?: string | null
          client_id: string
          commission_amount: number
          commission_rate: number
          completion_date?: string | null
          contract_number?: string | null
          created_at?: string | null
          down_payment?: number | null
          id?: string
          installments: number
          monthly_payment: number
          notes?: string | null
          office_id: string
          product_id: string
          sale_date?: string
          sale_value: number
          seller_id: string
          settings?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          cancellation_date?: string | null
          client_id?: string
          commission_amount?: number
          commission_rate?: number
          completion_date?: string | null
          contract_number?: string | null
          created_at?: string | null
          down_payment?: number | null
          id?: string
          installments?: number
          monthly_payment?: number
          notes?: string | null
          office_id?: string
          product_id?: string
          sale_date?: string
          sale_value?: number
          seller_id?: string
          settings?: Json | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "consortium_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          setting_key: string
          setting_type: string
          setting_value?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean | null
          id: string
          joined_at: string | null
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          goals: Json | null
          id: string
          leader_id: string | null
          metrics: Json | null
          name: string
          office_id: string
          parent_team_id: string | null
          settings: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          goals?: Json | null
          id?: string
          leader_id?: string | null
          metrics?: Json | null
          name: string
          office_id: string
          parent_team_id?: string | null
          settings?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          goals?: Json | null
          id?: string
          leader_id?: string | null
          metrics?: Json | null
          name?: string
          office_id?: string
          parent_team_id?: string | null
          settings?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          invited_at: string | null
          joined_at: string | null
          permissions: Json | null
          profile_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          permissions?: Json | null
          profile_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          permissions?: Json | null
          profile_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          max_api_calls: number | null
          max_offices: number | null
          max_storage_gb: number | null
          max_users: number | null
          name: string
          settings: Json | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"] | null
          subscription_ends_at: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_starts_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          max_api_calls?: number | null
          max_offices?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          name: string
          settings?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"] | null
          subscription_ends_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_starts_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          max_api_calls?: number | null
          max_offices?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"] | null
          subscription_ends_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_starts_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_custom: boolean
          level: number
          name: string
          permissions: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_custom?: boolean
          level?: number
          name: string
          permissions?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_custom?: boolean
          level?: number
          name?: string
          permissions?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_to_tenant: {
        Args: {
          user_id: string
          user_email: string
          user_full_name: string
          target_tenant_id: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: Json
      }
      calculate_commission: {
        Args: { p_sale_value: number; p_commission_rate: number }
        Returns: number
      }
      create_initial_user_setup: {
        Args: {
          user_id: string
          user_email: string
          user_full_name: string
          tenant_name: string
          tenant_slug: string
        }
        Returns: Json
      }
      get_authenticated_user_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_role_in_tenant: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_tenant_ids: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      is_tenant_owner: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      office_type: "matriz" | "filial" | "representacao"
      subscription_plan: "starter" | "professional" | "enterprise"
      tenant_status: "trial" | "active" | "suspended" | "cancelled"
      user_role: "owner" | "admin" | "manager" | "user" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      office_type: ["matriz", "filial", "representacao"],
      subscription_plan: ["starter", "professional", "enterprise"],
      tenant_status: ["trial", "active", "suspended", "cancelled"],
      user_role: ["owner", "admin", "manager", "user", "viewer"],
    },
  },
} as const
