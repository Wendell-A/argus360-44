export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
            foreignKeyName: "fk_automated_tasks_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_masked"
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
            foreignKeyName: "fk_client_funnel_position_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_masked"
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
          {
            foreignKeyName: "fk_client_interactions_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      client_transfers: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          from_user_id: string
          id: string
          notes: string | null
          reason: string | null
          status: string
          tenant_id: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          from_user_id: string
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string
          tenant_id: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          from_user_id?: string
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string
          tenant_id?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
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
            referencedRelation: "commission_details_view"
            referencedColumns: ["commission_id"]
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
      dashboard_configurations: {
        Row: {
          config_name: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean | null
          tenant_id: string
          updated_at: string
          user_id: string | null
          widget_configs: Json
        }
        Insert: {
          config_name: string
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
          widget_configs?: Json
        }
        Update: {
          config_name?: string
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          widget_configs?: Json
        }
        Relationships: []
      }
      defaulters: {
        Row: {
          ata: string | null
          bem_descricao: string | null
          cliente_nome: string | null
          cod_grupo: string | null
          cod_revenda: string | null
          cota: number | null
          created_at: string
          data_alocacao: string | null
          data_atualizacao: string | null
          data_contabilizacao: string | null
          email: string | null
          empresa: string | null
          id: string
          parcelas_pagas: number | null
          parcelas_vencidas: number | null
          prazo_cota_meses: number | null
          proposta: string | null
          revenda: string | null
          sale_id: string | null
          sequencia: number | null
          situacao_cobranca: string | null
          status_cota: string | null
          telefone: string | null
          tenant_id: string
          tipo_cota: string | null
          updated_at: string
          valor_bem_atual: number | null
          valor_bem_venda: number | null
        }
        Insert: {
          ata?: string | null
          bem_descricao?: string | null
          cliente_nome?: string | null
          cod_grupo?: string | null
          cod_revenda?: string | null
          cota?: number | null
          created_at?: string
          data_alocacao?: string | null
          data_atualizacao?: string | null
          data_contabilizacao?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          parcelas_pagas?: number | null
          parcelas_vencidas?: number | null
          prazo_cota_meses?: number | null
          proposta?: string | null
          revenda?: string | null
          sale_id?: string | null
          sequencia?: number | null
          situacao_cobranca?: string | null
          status_cota?: string | null
          telefone?: string | null
          tenant_id: string
          tipo_cota?: string | null
          updated_at?: string
          valor_bem_atual?: number | null
          valor_bem_venda?: number | null
        }
        Update: {
          ata?: string | null
          bem_descricao?: string | null
          cliente_nome?: string | null
          cod_grupo?: string | null
          cod_revenda?: string | null
          cota?: number | null
          created_at?: string
          data_alocacao?: string | null
          data_atualizacao?: string | null
          data_contabilizacao?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          parcelas_pagas?: number | null
          parcelas_vencidas?: number | null
          prazo_cota_meses?: number | null
          proposta?: string | null
          revenda?: string | null
          sale_id?: string | null
          sequencia?: number | null
          situacao_cobranca?: string | null
          status_cota?: string | null
          telefone?: string | null
          tenant_id?: string
          tipo_cota?: string | null
          updated_at?: string
          valor_bem_atual?: number | null
          valor_bem_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "defaulters_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defaulters_tenant_id_fkey"
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
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_masked"
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
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_masked"
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
      notifications: {
        Row: {
          created_at: string
          cta_link: string | null
          data: Json
          id: string
          is_read: boolean
          tenant_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          data?: Json
          id?: string
          is_read?: boolean
          tenant_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          data?: Json
          id?: string
          is_read?: boolean
          tenant_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
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
          lgpd_accepted_at: string | null
          lgpd_version_accepted: string | null
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
          lgpd_accepted_at?: string | null
          lgpd_version_accepted?: string | null
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
          lgpd_accepted_at?: string | null
          lgpd_version_accepted?: string | null
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
      proposals: {
        Row: {
          client_id: string
          created_at: string
          data_da_simulacao: string
          id: string
          office_id: string
          prazo: number
          product_id: string
          taxa_comissao_escritorio: number
          taxa_comissao_vendedor: number
          tenant_id: string
          updated_at: string
          valor_da_parcela: number
          valor_da_simulacao: number
        }
        Insert: {
          client_id: string
          created_at?: string
          data_da_simulacao: string
          id?: string
          office_id: string
          prazo: number
          product_id: string
          taxa_comissao_escritorio: number
          taxa_comissao_vendedor: number
          tenant_id: string
          updated_at?: string
          valor_da_parcela: number
          valor_da_simulacao: number
        }
        Update: {
          client_id?: string
          created_at?: string
          data_da_simulacao?: string
          id?: string
          office_id?: string
          prazo?: number
          product_id?: string
          taxa_comissao_escritorio?: number
          taxa_comissao_vendedor?: number
          tenant_id?: string
          updated_at?: string
          valor_da_parcela?: number
          valor_da_simulacao?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      public_invitation_links: {
        Row: {
          created_at: string | null
          created_by: string
          current_uses: number | null
          department_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
          office_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          team_id: string | null
          tenant_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          department_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          office_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string | null
          tenant_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          department_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          office_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string | null
          tenant_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: []
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
          ata: string | null
          cancellation_date: string | null
          client_id: string
          cod_grupo: number | null
          commission_amount: number
          commission_rate: number
          completion_date: string | null
          contract_number: string | null
          cota: number | null
          created_at: string | null
          down_payment: number | null
          id: string
          installments: number
          monthly_payment: number
          notes: string | null
          office_id: string
          product_id: string
          proposta: string | null
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
          ata?: string | null
          cancellation_date?: string | null
          client_id: string
          cod_grupo?: number | null
          commission_amount: number
          commission_rate: number
          completion_date?: string | null
          contract_number?: string | null
          cota?: number | null
          created_at?: string | null
          down_payment?: number | null
          id?: string
          installments: number
          monthly_payment: number
          notes?: string | null
          office_id: string
          product_id: string
          proposta?: string | null
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
          ata?: string | null
          cancellation_date?: string | null
          client_id?: string
          cod_grupo?: number | null
          commission_amount?: number
          commission_rate?: number
          completion_date?: string | null
          contract_number?: string | null
          cota?: number | null
          created_at?: string | null
          down_payment?: number | null
          id?: string
          installments?: number
          monthly_payment?: number
          notes?: string | null
          office_id?: string
          product_id?: string
          proposta?: string | null
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
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_masked"
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
          is_final_stage: boolean
          is_initial_stage: boolean
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
          is_final_stage?: boolean
          is_initial_stage?: boolean
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
          is_final_stage?: boolean
          is_initial_stage?: boolean
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
          is_default_rate: boolean | null
          max_sale_value: number | null
          min_sale_value: number | null
          product_id: string
          seller_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          commission_rate: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default_rate?: boolean | null
          max_sale_value?: number | null
          min_sale_value?: number | null
          product_id: string
          seller_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default_rate?: boolean | null
          max_sale_value?: number | null
          min_sale_value?: number | null
          product_id?: string
          seller_id?: string | null
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
      sensitive_data_access_log: {
        Row: {
          access_type: string
          created_at: string | null
          field_name: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          record_id: string | null
          table_name: string
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          created_at?: string | null
          field_name: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string | null
          field_name?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      super_admin_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          super_admin_id: string | null
          token_hash: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          super_admin_id?: string | null
          token_hash: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          super_admin_id?: string | null
          token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_sessions_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          session_expires_at: string | null
          session_token: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          session_expires_at?: string | null
          session_token?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          session_expires_at?: string | null
          session_token?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_ticket_comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          ticket_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_support_comments_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_support_comments_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_support_comments_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["support_ticket_category"]
          closed_at: string | null
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          resolution: string | null
          resolved_at: string | null
          settings: Json | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          tenant_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_ticket_category"]
          closed_at?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          resolution?: string | null
          resolved_at?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          tenant_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_ticket_category"]
          closed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          resolution?: string | null
          resolved_at?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_support_tickets_assigned"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_support_tickets_assigned"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_support_tickets_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_support_tickets_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_support_tickets_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_masked"
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
      tenant_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          due_date: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          due_date: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_pricing: {
        Row: {
          created_at: string | null
          created_by: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          monthly_price: number
          plan_type: string
          setup_fee: number | null
          tenant_id: string | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          monthly_price: number
          plan_type: string
          setup_fee?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          monthly_price?: number
          plan_type?: string
          setup_fee?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_pricing_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_pricing_tenant_id_fkey"
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
          granular_permissions: Json | null
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
          granular_permissions?: Json | null
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
          granular_permissions?: Json | null
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
      training_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          is_public: boolean
          order_index: number
          tenant_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_video_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          order_index?: number
          tenant_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_video_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          order_index?: number
          tenant_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "training_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_videos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      clients_masked: {
        Row: {
          address: Json | null
          birth_date: string | null
          classification: string | null
          created_at: string | null
          data_masked: boolean | null
          document: string | null
          email: string | null
          id: string | null
          monthly_income: number | null
          name: string | null
          notes: string | null
          occupation: string | null
          office_id: string | null
          phone: string | null
          responsible_user_id: string | null
          secondary_phone: string | null
          settings: Json | null
          source: string | null
          status: string | null
          tenant_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
          classification?: string | null
          created_at?: string | null
          data_masked?: never
          document?: never
          email?: never
          id?: string | null
          monthly_income?: number | null
          name?: string | null
          notes?: string | null
          occupation?: string | null
          office_id?: string | null
          phone?: never
          responsible_user_id?: string | null
          secondary_phone?: never
          settings?: Json | null
          source?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
          classification?: string | null
          created_at?: string | null
          data_masked?: never
          document?: never
          email?: never
          id?: string | null
          monthly_income?: number | null
          name?: string | null
          notes?: string | null
          occupation?: string | null
          office_id?: string | null
          phone?: never
          responsible_user_id?: string | null
          secondary_phone?: never
          settings?: Json | null
          source?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
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
      commission_details_view: {
        Row: {
          base_amount: number | null
          client_id: string | null
          commission_amount: number | null
          commission_id: string | null
          commission_rate: number | null
          commission_type: string | null
          due_date: string | null
          installment_number: number | null
          office_id: string | null
          product_id: string | null
          product_name: string | null
          recipient_id: string | null
          recipient_type: string | null
          sale_date: string | null
          sale_id: string | null
          seller_id: string | null
          status: string | null
          tenant_id: string | null
          total_installments: number | null
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
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_masked"
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
        ]
      }
      profiles_masked: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          data_masked: boolean | null
          department: string | null
          department_id: string | null
          email: string | null
          full_name: string | null
          hierarchical_level: number | null
          hire_date: string | null
          id: string | null
          phone: string | null
          position: string | null
          position_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          data_masked?: never
          department?: string | null
          department_id?: string | null
          email?: never
          full_name?: string | null
          hierarchical_level?: number | null
          hire_date?: string | null
          id?: string | null
          phone?: never
          position?: string | null
          position_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          data_masked?: never
          department?: string | null
          department_id?: string | null
          email?: never
          full_name?: string | null
          hierarchical_level?: number | null
          hire_date?: string | null
          id?: string | null
          phone?: never
          position?: string | null
          position_id?: string | null
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
      proposals_with_client_info: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          data_da_simulacao: string | null
          id: string | null
          office_id: string | null
          prazo: number | null
          product_id: string | null
          taxa_comissao_escritorio: number | null
          taxa_comissao_vendedor: number | null
          tenant_id: string | null
          updated_at: string | null
          valor_da_parcela: number | null
          valor_da_simulacao: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users_masked: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          context_level: number | null
          created_at: string | null
          data_masked: boolean | null
          department: string | null
          department_id: string | null
          email: string | null
          full_name: string | null
          hierarchical_level: number | null
          hire_date: string | null
          id: string | null
          invited_at: string | null
          joined_at: string | null
          office_id: string | null
          permissions: Json | null
          phone: string | null
          position: string | null
          profile_id: string | null
          profile_position_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          team_id: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["profile_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
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
    }
    Functions: {
      accept_invitation: {
        Args: {
          invitation_token: string
          user_email: string
          user_full_name: string
          user_id: string
        }
        Returns: Json
      }
      accept_lgpd_terms: {
        Args: { terms_version: string }
        Returns: boolean
      }
      accept_public_invitation: {
        Args: {
          p_token: string
          p_user_email: string
          p_user_full_name: string
          p_user_id: string
        }
        Returns: Json
      }
      add_user_to_tenant: {
        Args: {
          target_tenant_id: string
          user_email: string
          user_full_name: string
          user_id: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: Json
      }
      authenticate_super_admin: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      calculate_commission: {
        Args: { p_commission_rate: number; p_sale_value: number }
        Returns: number
      }
      can_access_profile_in_tenant: {
        Args: { profile_user_id: string }
        Returns: boolean
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
          action_type: string
          resource_id?: string
          resource_type: string
          tenant_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
      can_view_full_client_data: {
        Args: { p_client_id: string; p_user_id?: string }
        Returns: boolean
      }
      check_permission_migration: {
        Args: Record<PropertyKey, never>
        Returns: {
          migrated_role_permissions: number
          new_permissions_count: number
          old_permissions_count: number
        }[]
      }
      create_initial_user_setup: {
        Args: {
          tenant_name: string
          tenant_slug: string
          user_email: string
          user_full_name: string
          user_id: string
        }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_cta_link?: string
          p_data: Json
          p_tenant_id: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_super_admin: {
        Args: { p_email: string; p_full_name: string; p_password: string }
        Returns: Json
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_public_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_super_admin_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_audit_statistics: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: Json
      }
      get_authenticated_user_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_client_data_masked: {
        Args: { p_client_id: string; p_tenant_id?: string; p_user_id?: string }
        Returns: Json
      }
      get_commissions_complete_optimized: {
        Args: {
          limit_param?: number
          offset_param?: number
          tenant_uuid: string
        }
        Returns: {
          commission_data: Json
          commission_id: string
          parent_commission_data: Json
          recipient_data: Json
          sale_data: Json
        }[]
      }
      get_contextual_audit_logs: {
        Args: {
          p_action_filter?: string
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
          p_resource_type?: string
          tenant_uuid: string
          user_uuid: string
        }
        Returns: {
          action: string
          context_level: number
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json
          old_values: Json
          record_id: string
          table_name: string
          tenant_id: string
          user_agent: string
          user_id: string
          user_role: string
        }[]
      }
      get_contextual_clients: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: {
          address: Json
          birth_date: string
          classification: string
          created_at: string
          document: string
          email: string
          id: string
          monthly_income: number
          name: string
          notes: string
          occupation: string
          office_id: string
          phone: string
          responsible_user_id: string
          secondary_phone: string
          settings: Json
          source: string
          status: string
          tenant_id: string
          type: string
          updated_at: string
        }[]
      }
      get_contextual_commissions: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: {
          approval_date: string
          base_amount: number
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at: string
          due_date: string
          id: string
          installment_amount: number
          installment_number: number
          notes: string
          parent_commission_id: string
          payment_date: string
          payment_method: string
          payment_reference: string
          recipient_id: string
          recipient_type: string
          sale_id: string
          settings: Json
          status: string
          tenant_id: string
          total_installments: number
          updated_at: string
        }[]
      }
      get_contextual_dashboard_stats: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: Json
      }
      get_contextual_interactions: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: {
          client_id: string
          completed_at: string
          created_at: string
          description: string
          id: string
          interaction_type: string
          next_action: string
          next_action_date: string
          outcome: string
          priority: string
          scheduled_at: string
          seller_id: string
          settings: Json
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }[]
      }
      get_contextual_sales: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: {
          approval_date: string
          cancellation_date: string
          client_id: string
          commission_amount: number
          commission_rate: number
          completion_date: string
          contract_number: string
          created_at: string
          down_payment: number
          id: string
          installments: number
          monthly_payment: number
          notes: string
          office_id: string
          product_id: string
          sale_date: string
          sale_value: number
          seller_id: string
          settings: Json
          status: string
          tenant_id: string
          updated_at: string
        }[]
      }
      get_contextual_users: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: {
          active: boolean
          context_level: number
          created_at: string
          department_id: string
          invited_at: string
          joined_at: string
          office_id: string
          permissions: Json
          profile_id: string
          role: Database["public"]["Enums"]["user_role"]
          team_id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_conversion_rate_summary: {
        Args: {
          p_end_date: string
          p_office_id: string
          p_start_date: string
          p_tenant_id: string
        }
        Returns: {
          conversion_goal: number
          conversion_rate: number
          current_conversions: number
          progress_percentage: number
          total_entered: number
        }[]
      }
      get_crm_complete_optimized: {
        Args: { limit_param?: number; tenant_uuid: string }
        Returns: {
          client_data: Json
          client_id: string
          funnel_position: Json
          pending_tasks: Json
          recent_interactions: Json
          sales_data: Json
        }[]
      }
      get_current_super_admin_safe: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_dashboard_complete_optimized: {
        Args: { tenant_uuid: string }
        Returns: {
          commission_summary: Json
          goals_data: Json
          pending_tasks: Json
          recent_clients: Json
          recent_sales: Json
          stats_data: Json
        }[]
      }
      get_dashboard_stats_config: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: Json
      }
      get_defaulters_list: {
        Args: {
          p_page_number?: number
          p_page_size?: number
          p_search_term?: string
          p_situacao_filter?: string
          p_status_filter?: string
        }
        Returns: Json
      }
      get_filtered_dashboard_data: {
        Args: {
          p_end_date?: string
          p_office_ids?: string[]
          p_product_ids?: string[]
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_funnel_stats_optimized: {
        Args: { tenant_uuid: string }
        Returns: {
          avg_probability: number
          clients_count: number
          conversion_rate: number
          order_index: number
          stage_color: string
          stage_id: string
          stage_name: string
          total_expected_value: number
        }[]
      }
      get_query_performance_metrics: {
        Args: { tenant_uuid: string }
        Returns: {
          measurement_time: string
          metric_name: string
          metric_value: number
        }[]
      }
      get_sales_complete_optimized: {
        Args: {
          limit_param?: number
          offset_param?: number
          tenant_uuid: string
        }
        Returns: {
          client_data: Json
          commission_summary: Json
          office_data: Json
          product_data: Json
          sale_data: Json
          sale_id: string
          seller_data: Json
        }[]
      }
      get_security_monitoring_data: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: Json
      }
      get_tenant_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_unread_notification_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_context_offices: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: string[]
      }
      get_user_full_context: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: Json
      }
      get_user_menu_config: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: Json
      }
      get_user_profile_complete: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_profile_safe: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_role_in_tenant: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_tenant_ids: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      get_users_complete_optimized: {
        Args: {
          limit_param?: number
          offset_param?: number
          tenant_uuid: string
        }
        Returns: {
          department_data: Json
          office_data: Json
          permissions_data: Json
          position_data: Json
          profile_data: Json
          stats_data: Json
          user_data: Json
          user_id: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_any_role_in_tenant: {
        Args: {
          _roles: Database["public"]["Enums"]["user_role"][]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      has_granular_permission: {
        Args: {
          p_action: string
          p_module: string
          p_resource: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      has_role_in_tenant: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_tenant_owner: {
        Args: { tenant_uuid: string; user_uuid: string }
        Returns: boolean
      }
      log_contextual_audit_event: {
        Args: {
          p_action: string
          p_additional_context?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_tenant_uuid: string
          p_user_uuid: string
        }
        Returns: string
      }
      log_sensitive_access: {
        Args: {
          p_access_type?: string
          p_field_name: string
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_sensitive_client_access: {
        Args: {
          _access_type: string
          _client_id: string
          _fields_accessed: string[]
        }
        Returns: undefined
      }
      mask_document: {
        Args: { doc: string }
        Returns: string
      }
      mask_email: {
        Args: { email: string }
        Returns: string
      }
      mask_phone: {
        Args: { phone: string }
        Returns: string
      }
      migrate_role_permissions_to_granular: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_invitation_on_auth: {
        Args: { p_email: string; p_user_id: string }
        Returns: Json
      }
      send_invitation_via_auth: {
        Args: {
          p_email: string
          p_redirect_to?: string
          p_role?: Database["public"]["Enums"]["user_role"]
          p_tenant_id: string
        }
        Returns: Json
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      validate_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      validate_public_invitation_token: {
        Args: { p_token: string }
        Returns: Json
      }
      validate_super_admin_session: {
        Args: { p_token: string } | { p_token: string }
        Returns: Json
      }
      validate_tenant_isolation: {
        Args: { record_tenant_id: string; table_name: string; user_id?: string }
        Returns: boolean
      }
      verify_strict_tenant_isolation: {
        Args: { _table_name: string; _tenant_id: string; _user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      office_type: "matriz" | "filial" | "representacao"
      subscription_plan: "starter" | "professional" | "enterprise"
      support_ticket_category:
        | "bug"
        | "feature_request"
        | "technical_support"
        | "account"
        | "billing"
        | "training"
        | "other"
      support_ticket_priority: "low" | "normal" | "high" | "urgent"
      support_ticket_status:
        | "open"
        | "in_progress"
        | "pending_user"
        | "resolved"
        | "closed"
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
      support_ticket_category: [
        "bug",
        "feature_request",
        "technical_support",
        "account",
        "billing",
        "training",
        "other",
      ],
      support_ticket_priority: ["low", "normal", "high", "urgent"],
      support_ticket_status: [
        "open",
        "in_progress",
        "pending_user",
        "resolved",
        "closed",
      ],
      tenant_status: ["trial", "active", "suspended", "cancelled"],
      user_role: ["owner", "admin", "manager", "user", "viewer"],
    },
  },
} as const
