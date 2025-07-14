export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auditoria_sistema: {
        Row: {
          acao: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          id: number
          id_escritorio: number | null
          id_usuario: number | null
          ip_origem: unknown | null
          registro_id: number | null
          tabela_afetada: string | null
          timestamp_acao: string | null
          user_agent: string | null
          uuid: string
        }
        Insert: {
          acao: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: number
          id_escritorio?: number | null
          id_usuario?: number | null
          ip_origem?: unknown | null
          registro_id?: number | null
          tabela_afetada?: string | null
          timestamp_acao?: string | null
          user_agent?: string | null
          uuid?: string
        }
        Update: {
          acao?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          id?: number
          id_escritorio?: number | null
          id_usuario?: number | null
          ip_origem?: unknown | null
          registro_id?: number | null
          tabela_afetada?: string | null
          timestamp_acao?: string | null
          user_agent?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_sistema_id_escritorio_fkey"
            columns: ["id_escritorio"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_sistema_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      escritorios: {
        Row: {
          aceite_lgpd: boolean | null
          cep: string | null
          cidade: string | null
          cnpj: string
          configuracoes: Json | null
          data_aceite_lgpd: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_trial_fim: string | null
          email: string
          endereco_completo: string | null
          estado: string | null
          id: number
          id_plano: number
          ip_permitidos: unknown[] | null
          max_tentativas_login: number | null
          nome_fantasia: string
          razao_social: string
          require_2fa: boolean | null
          status: string | null
          telefone: string | null
          timeout_sessao_minutos: number | null
          uuid: string
        }
        Insert: {
          aceite_lgpd?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj: string
          configuracoes?: Json | null
          data_aceite_lgpd?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_trial_fim?: string | null
          email: string
          endereco_completo?: string | null
          estado?: string | null
          id?: number
          id_plano: number
          ip_permitidos?: unknown[] | null
          max_tentativas_login?: number | null
          nome_fantasia: string
          razao_social: string
          require_2fa?: boolean | null
          status?: string | null
          telefone?: string | null
          timeout_sessao_minutos?: number | null
          uuid?: string
        }
        Update: {
          aceite_lgpd?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          configuracoes?: Json | null
          data_aceite_lgpd?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_trial_fim?: string | null
          email?: string
          endereco_completo?: string | null
          estado?: string | null
          id?: number
          id_plano?: number
          ip_permitidos?: unknown[] | null
          max_tentativas_login?: number | null
          nome_fantasia?: string
          razao_social?: string
          require_2fa?: boolean | null
          status?: string | null
          telefone?: string | null
          timeout_sessao_minutos?: number | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "escritorios_id_plano_fkey"
            columns: ["id_plano"]
            isOneToOne: false
            referencedRelation: "planos_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_acesso: {
        Row: {
          ativo: boolean | null
          data_atualizacao: string | null
          data_criacao: string | null
          descricao: string | null
          id: number
          id_escritorio: number
          nivel_acesso: number | null
          nome: string
          permissoes: Json | null
          sistema: boolean | null
          uuid: string
        }
        Insert: {
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          descricao?: string | null
          id?: number
          id_escritorio: number
          nivel_acesso?: number | null
          nome: string
          permissoes?: Json | null
          sistema?: boolean | null
          uuid?: string
        }
        Update: {
          ativo?: boolean | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          descricao?: string | null
          id?: number
          id_escritorio?: number
          nivel_acesso?: number | null
          nome?: string
          permissoes?: Json | null
          sistema?: boolean | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_acesso_id_escritorio_fkey"
            columns: ["id_escritorio"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_saas: {
        Row: {
          ativo: boolean | null
          codigo: string
          data_atualizacao: string | null
          data_criacao: string | null
          descricao: string | null
          id: number
          max_clientes: number | null
          max_usuarios: number | null
          nome: string
          recursos_inclusos: string[] | null
          uuid: string
          valor_mensal: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          descricao?: string | null
          id?: number
          max_clientes?: number | null
          max_usuarios?: number | null
          nome: string
          recursos_inclusos?: string[] | null
          uuid?: string
          valor_mensal?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          descricao?: string | null
          id?: number
          max_clientes?: number | null
          max_usuarios?: number | null
          nome?: string
          recursos_inclusos?: string[] | null
          uuid?: string
          valor_mensal?: number | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          bloqueado_ate: string | null
          configuracoes_usuario: Json | null
          data_atualizacao: string | null
          data_criacao: string | null
          deve_trocar_senha: boolean | null
          email: string
          email_verificado: boolean | null
          id: number
          id_escritorio: number
          id_perfil_acesso: number
          nome: string
          password_hash: string
          tentativas_login: number | null
          totp_ativo: boolean | null
          totp_secret: string | null
          ultimo_ip: unknown | null
          ultimo_login: string | null
          uuid: string
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          bloqueado_ate?: string | null
          configuracoes_usuario?: Json | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          deve_trocar_senha?: boolean | null
          email: string
          email_verificado?: boolean | null
          id?: number
          id_escritorio: number
          id_perfil_acesso: number
          nome: string
          password_hash: string
          tentativas_login?: number | null
          totp_ativo?: boolean | null
          totp_secret?: string | null
          ultimo_ip?: unknown | null
          ultimo_login?: string | null
          uuid?: string
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          bloqueado_ate?: string | null
          configuracoes_usuario?: Json | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          deve_trocar_senha?: boolean | null
          email?: string
          email_verificado?: boolean | null
          id?: number
          id_escritorio?: number
          id_perfil_acesso?: number
          nome?: string
          password_hash?: string
          tentativas_login?: number | null
          totp_ativo?: boolean | null
          totp_secret?: string | null
          ultimo_ip?: unknown | null
          ultimo_login?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_escritorio_fkey"
            columns: ["id_escritorio"]
            isOneToOne: false
            referencedRelation: "escritorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_id_perfil_acesso_fkey"
            columns: ["id_perfil_acesso"]
            isOneToOne: false
            referencedRelation: "perfis_acesso"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_perfis_padrao: {
        Args: { escritorio_id: number }
        Returns: undefined
      }
      get_user_escritorio_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      user_has_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
