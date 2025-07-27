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
      automated_tasks: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          priority: string
          seller_id: string
          settings: Json | null
          status: string
          task_type: string
          template_id: string | null
          tenant_id: string
          title: string
          trigger_stage_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string
          seller_id: string
          settings?: Json | null
          status?: string
          task_type: string
          template_id?: string | null
          tenant_id: string
          title: string
          trigger_stage_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string
          seller_id?: string
          settings?: Json | null
          status?: string
          task_type?: string
          template_id?: string | null
          tenant_id?: string
          title?: string
          trigger_stage_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_automated_tasks_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_automated_tasks_template_id"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_automated_tasks_trigger_stage_id"
            columns: ["trigger_stage_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_funnel_position: {
        Row: {
          client_id: string
          created_at: string | null
          entered_at: string | null
          estimated_close_date: string | null
          exited_at: string | null
          expected_value: number | null
          id: string
          is_current: boolean | null
          notes: string | null
          probability: number | null
          stage_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          entered_at?: string | null
          estimated_close_date?: string | null
          exited_at?: string | null
          expected_value?: number | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          probability?: number | null
          stage_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          entered_at?: string | null
          estimated_close_date?: string | null
          exited_at?: string | null
          expected_value?: number | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          probability?: number | null
          stage_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_client_funnel_position_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_funnel_position_stage_id"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          interaction_type: string
          next_action: string | null
          next_action_date: string | null
          outcome: string | null
          priority: string
          scheduled_at: string | null
          seller_id: string
          settings: Json | null
          status: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_type: string
          next_action?: string | null
          next_action_date?: string | null
          outcome?: string | null
          priority?: string
          scheduled_at?: string | null
          seller_id: string
          settings?: Json | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_type?: string
          next_action?: string | null
          next_action_date?: string | null
          outcome?: string | null
          priority?: string
          scheduled_at?: string | null
          seller_id?: string
          settings?: Json | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_client_interactions_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      commission_payment_schedules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          installment_number: number
          percentage: number
          product_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          installment_number: number
          percentage: number
          product_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          installment_number?: number
          percentage?: number
          product_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_commission_schedule_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "consortium_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commission_schedule_tenant"
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
          commission_type: string | null
          created_at: string | null
          due_date: string
          id: string
          installment_amount: number | null
          installment_number: number | null
          notes: string | null
          parent_commission_id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          recipient_id: string
          recipient_type: string
          sale_id: string
          settings: Json | null
          status: string | null
          tenant_id: string
          total_installments: number | null
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          base_amount: number
          commission_amount: number
          commission_rate: number
          commission_type?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          installment_amount?: number | null
          installment_number?: number | null
          notes?: string | null
          parent_commission_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          recipient_id: string
          recipient_type: string
          sale_id: string
          settings?: Json | null
          status?: string | null
          tenant_id: string
          total_installments?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          base_amount?: number
          commission_amount?: number
          commission_rate?: number
          commission_type?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          installment_amount?: number | null
          installment_number?: number | null
          notes?: string | null
          parent_commission_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          recipient_id?: string
          recipient_type?: string
          sale_id?: string
          settings?: Json | null
          status?: string | null
          tenant_id?: string
          total_installments?: number | null
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
          {
            foreignKeyName: "fk_commissions_parent"
            columns: ["parent_commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      consortium_products: {
        Row: {
          adjustment_index: string | null
          administration_fee: number
          advance_fee_rate: number | null
          category: string
          commission_rate: number
          contemplation_modes: Json | null
          created_at: string | null
          description: string | null
          embedded_bid_rate: number | null
          id: string
          installments: number
          max_admin_fee: number | null
          max_credit_value: number | null
          min_admin_fee: number | null
          min_credit_value: number | null
          min_down_payment: number | null
          name: string
          reserve_fund_rate: number | null
          settings: Json | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          adjustment_index?: string | null
          administration_fee: number
          advance_fee_rate?: number | null
          category: string
          commission_rate: number
          contemplation_modes?: Json | null
          created_at?: string | null
          description?: string | null
          embedded_bid_rate?: number | null
          id?: string
          installments: number
          max_admin_fee?: number | null
          max_credit_value?: number | null
          min_admin_fee?: number | null
          min_credit_value?: number | null
          min_down_payment?: number | null
          name: string
          reserve_fund_rate?: number | null
          settings?: Json | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          adjustment_index?: string | null
          administration_fee?: number
          advance_fee_rate?: number | null
          category?: string
          commission_rate?: number
          contemplation_modes?: Json | null
          created_at?: string | null
          description?: string | null
          embedded_bid_rate?: number | null
          id?: string
          installments?: number
          max_admin_fee?: number | null
          max_credit_value?: number | null
          min_admin_fee?: number | null
          min_credit_value?: number | null
          min_down_payment?: number | null
          name?: string
          reserve_fund_rate?: number | null
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
      goals: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_amount: number | null
          description: string | null
          goal_type: string
          id: string
          office_id: string | null
          period_end: string
          period_start: string
          status: string | null
          target_amount: number
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_amount?: number | null
          description?: string | null
          goal_type: string
          id?: string
          office_id?: string | null
          period_end: string
          period_start: string
          status?: string | null
          target_amount: number
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_amount?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          office_id?: string | null
          period_end?: string
          period_start?: string
          status?: string | null
          target_amount?: number
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invited_by: string
          metadata: Json | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invited_by: string
          metadata?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string
          metadata?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          stage_id: string | null
          template_text: string
          tenant_id: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          stage_id?: string | null
          template_text: string
          tenant_id: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          stage_id?: string | null
          template_text?: string
          tenant_id?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_message_templates_stage_id"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel_stages"
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
      permission_contexts: {
        Row: {
          context_id: string | null
          context_type: string
          created_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type: string
          created_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string
          created_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_contexts_tenant_id_fkey"
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
      product_chargeback_schedules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_payment_number: number
          percentage: number
          product_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_payment_number: number
          percentage: number
          product_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_payment_number?: number
          percentage?: number
          product_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_chargeback_schedule_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "consortium_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chargeback_schedule_tenant"
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
      sales_funnel_stages: {
        Row: {
          automated_tasks: Json | null
          color: string
          conversion_goals: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          automated_tasks?: Json | null
          color?: string
          conversion_goals?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          automated_tasks?: Json | null
          color?: string
          conversion_goals?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_commissions: {
        Row: {
          commission_rate: number
          created_at: string | null
          id: string
          is_active: boolean | null
          max_sale_value: number | null
          min_sale_value: number | null
          product_id: string
          seller_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          commission_rate: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_sale_value?: number | null
          min_sale_value?: number | null
          product_id: string
          seller_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_sale_value?: number | null
          min_sale_value?: number | null
          product_id?: string
          seller_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_seller_commissions_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "consortium_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_seller_commissions_tenant"
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
          context_level: number | null
          created_at: string | null
          department_id: string | null
          id: string
          invited_at: string | null
          joined_at: string | null
          office_id: string | null
          permissions: Json | null
          profile_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          team_id: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          context_level?: number | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          office_id?: string | null
          permissions?: Json | null
          profile_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          team_id?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          context_level?: number | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          office_id?: string | null
          permissions?: Json | null
          profile_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          team_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      accept_invitation: {
        Args: {
          invitation_token: string
          user_id: string
          user_email: string
          user_full_name: string
        }
        Returns: Json
      }
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
      can_access_user_data: {
        Args: {
          accessing_user_id: string
          target_user_id: string
          tenant_uuid: string
        }
        Returns: boolean
      }
      can_user_perform_action: {
        Args: {
          user_uuid: string
          tenant_uuid: string
          action_type: string
          resource_type: string
          resource_id?: string
        }
        Returns: boolean
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
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_audit_statistics: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: Json
      }
      get_authenticated_user_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_contextual_audit_logs: {
        Args: {
          user_uuid: string
          tenant_uuid: string
          p_limit?: number
          p_offset?: number
          p_resource_type?: string
          p_action_filter?: string
          p_date_from?: string
          p_date_to?: string
        }
        Returns: {
          id: string
          user_id: string
          tenant_id: string
          table_name: string
          record_id: string
          action: string
          old_values: Json
          new_values: Json
          ip_address: unknown
          user_agent: string
          created_at: string
          user_role: string
          context_level: number
        }[]
      }
      get_contextual_clients: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: {
          id: string
          name: string
          email: string
          phone: string
          document: string
          type: string
          status: string
          office_id: string
          responsible_user_id: string
          classification: string
          monthly_income: number
          birth_date: string
          occupation: string
          secondary_phone: string
          address: Json
          notes: string
          source: string
          settings: Json
          created_at: string
          updated_at: string
          tenant_id: string
        }[]
      }
      get_contextual_commissions: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: {
          id: string
          sale_id: string
          recipient_id: string
          recipient_type: string
          commission_type: string
          base_amount: number
          commission_rate: number
          commission_amount: number
          installment_number: number
          total_installments: number
          installment_amount: number
          due_date: string
          payment_date: string
          approval_date: string
          status: string
          payment_method: string
          payment_reference: string
          notes: string
          settings: Json
          parent_commission_id: string
          created_at: string
          updated_at: string
          tenant_id: string
        }[]
      }
      get_contextual_dashboard_stats: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: Json
      }
      get_contextual_sales: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: {
          id: string
          client_id: string
          seller_id: string
          product_id: string
          office_id: string
          sale_value: number
          commission_rate: number
          commission_amount: number
          monthly_payment: number
          installments: number
          down_payment: number
          status: string
          sale_date: string
          approval_date: string
          completion_date: string
          cancellation_date: string
          contract_number: string
          notes: string
          settings: Json
          created_at: string
          updated_at: string
          tenant_id: string
        }[]
      }
      get_contextual_users: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: {
          user_id: string
          tenant_id: string
          role: Database["public"]["Enums"]["user_role"]
          office_id: string
          department_id: string
          team_id: string
          profile_id: string
          active: boolean
          context_level: number
          permissions: Json
          invited_at: string
          joined_at: string
          created_at: string
          updated_at: string
        }[]
      }
      get_dashboard_stats_config: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: Json
      }
      get_security_monitoring_data: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: Json
      }
      get_user_context_offices: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: string[]
      }
      get_user_full_context: {
        Args: { user_uuid: string; tenant_uuid: string }
        Returns: Json
      }
      get_user_menu_config: {
        Args: { user_uuid: string; tenant_uuid: string }
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
      log_contextual_audit_event: {
        Args: {
          p_user_uuid: string
          p_tenant_uuid: string
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_old_values?: Json
          p_new_values?: Json
          p_additional_context?: Json
        }
        Returns: string
      }
      process_invitation_on_auth: {
        Args: { p_user_id: string; p_email: string }
        Returns: Json
      }
      send_invitation_via_auth: {
        Args: {
          p_tenant_id: string
          p_email: string
          p_role?: Database["public"]["Enums"]["user_role"]
          p_redirect_to?: string
        }
        Returns: Json
      }
      validate_invitation: {
        Args: { invitation_token: string }
        Returns: Json
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
