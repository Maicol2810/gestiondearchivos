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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      consultas: {
        Row: {
          asunto: string
          created_at: string
          descripcion: string
          estado: string
          fecha_respuesta: string | null
          id: string
          nivel_urgencia: string
          respondido_por: string | null
          respuesta: string | null
          tipo_consulta: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          asunto: string
          created_at?: string
          descripcion: string
          estado?: string
          fecha_respuesta?: string | null
          id?: string
          nivel_urgencia?: string
          respondido_por?: string | null
          respuesta?: string | null
          tipo_consulta: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          asunto?: string
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_respuesta?: string | null
          id?: string
          nivel_urgencia?: string
          respondido_por?: string | null
          respuesta?: string | null
          tipo_consulta?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      dependencias: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          archivo_nombre: string | null
          archivo_url: string | null
          codigo_unico: string
          created_at: string
          created_by: string
          dependencia_id: string
          estado: Database["public"]["Enums"]["document_status"]
          fecha_creacion_documento: string | null
          fecha_ingreso: string
          id: string
          nombre: string
          observaciones: string | null
          serie_id: string
          soporte: Database["public"]["Enums"]["document_support"]
          subserie_id: string
          ubicacion_fisica: string | null
          updated_at: string
        }
        Insert: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          codigo_unico: string
          created_at?: string
          created_by: string
          dependencia_id: string
          estado?: Database["public"]["Enums"]["document_status"]
          fecha_creacion_documento?: string | null
          fecha_ingreso?: string
          id?: string
          nombre: string
          observaciones?: string | null
          serie_id: string
          soporte?: Database["public"]["Enums"]["document_support"]
          subserie_id: string
          ubicacion_fisica?: string | null
          updated_at?: string
        }
        Update: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          codigo_unico?: string
          created_at?: string
          created_by?: string
          dependencia_id?: string
          estado?: Database["public"]["Enums"]["document_status"]
          fecha_creacion_documento?: string | null
          fecha_ingreso?: string
          id?: string
          nombre?: string
          observaciones?: string | null
          serie_id?: string
          soporte?: Database["public"]["Enums"]["document_support"]
          subserie_id?: string
          ubicacion_fisica?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_dependencia_id_fkey"
            columns: ["dependencia_id"]
            isOneToOne: false
            referencedRelation: "dependencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "series_documentales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_subserie_id_fkey"
            columns: ["subserie_id"]
            isOneToOne: false
            referencedRelation: "subseries_documentales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documentos_created_by_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eliminaciones: {
        Row: {
          acta_eliminacion_url: string | null
          aprobado_por: string | null
          created_at: string
          documento_id: string
          estado: Database["public"]["Enums"]["elimination_status"]
          fecha_eliminacion_real: string | null
          fecha_programada_eliminacion: string
          id: string
          observaciones: string | null
          responsable_id: string
          updated_at: string
        }
        Insert: {
          acta_eliminacion_url?: string | null
          aprobado_por?: string | null
          created_at?: string
          documento_id: string
          estado?: Database["public"]["Enums"]["elimination_status"]
          fecha_eliminacion_real?: string | null
          fecha_programada_eliminacion: string
          id?: string
          observaciones?: string | null
          responsable_id: string
          updated_at?: string
        }
        Update: {
          acta_eliminacion_url?: string | null
          aprobado_por?: string | null
          created_at?: string
          documento_id?: string
          estado?: Database["public"]["Enums"]["elimination_status"]
          fecha_eliminacion_real?: string | null
          fecha_programada_eliminacion?: string
          id?: string
          observaciones?: string | null
          responsable_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eliminaciones_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      prestamos: {
        Row: {
          aprobado_por: string | null
          created_at: string
          documento_id: string
          estado: Database["public"]["Enums"]["loan_status"]
          fecha_devolucion_programada: string | null
          fecha_devolucion_real: string | null
          fecha_entrega: string | null
          fecha_solicitud: string
          id: string
          motivo_prestamo: string
          observaciones: string | null
          updated_at: string
          usuario_solicitante_id: string
        }
        Insert: {
          aprobado_por?: string | null
          created_at?: string
          documento_id: string
          estado?: Database["public"]["Enums"]["loan_status"]
          fecha_devolucion_programada?: string | null
          fecha_devolucion_real?: string | null
          fecha_entrega?: string | null
          fecha_solicitud?: string
          id?: string
          motivo_prestamo: string
          observaciones?: string | null
          updated_at?: string
          usuario_solicitante_id: string
        }
        Update: {
          aprobado_por?: string | null
          created_at?: string
          documento_id?: string
          estado?: Database["public"]["Enums"]["loan_status"]
          fecha_devolucion_programada?: string | null
          fecha_devolucion_real?: string | null
          fecha_entrega?: string | null
          fecha_solicitud?: string
          id?: string
          motivo_prestamo?: string
          observaciones?: string | null
          updated_at?: string
          usuario_solicitante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestamos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          dependencia_id: string | null
          email: string
          id: string
          nombre_completo: string
          password_hash: string | null
          rol: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dependencia_id?: string | null
          email: string
          id: string
          nombre_completo: string
          password_hash?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          dependencia_id?: string | null
          email?: string
          id?: string
          nombre_completo?: string
          password_hash?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_dependencia_id_fkey"
            columns: ["dependencia_id"]
            isOneToOne: false
            referencedRelation: "dependencias"
            referencedColumns: ["id"]
          },
        ]
      }
      series_documentales: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          tiempo_retencion_anos: number | null
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          tiempo_retencion_anos?: number | null
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          tiempo_retencion_anos?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subseries_documentales: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          serie_id: string
          tiempo_retencion_anos: number | null
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          serie_id: string
          tiempo_retencion_anos?: number | null
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          serie_id?: string
          tiempo_retencion_anos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subseries_documentales_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "series_documentales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_user: {
        Args: { user_email: string; user_password: string }
        Returns: Json
      }
      create_first_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_for_admin: {
        Args: {
          user_email: string
          user_password: string
          full_name: string
          user_role?: string
          dep_id?: string
          is_active?: boolean
        }
        Returns: Json
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      promote_to_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      document_status: "Activo" | "Transferido" | "Eliminado"
      document_support: "Papel" | "Digital"
      elimination_status: "Pendiente" | "En_revision" | "Eliminado"
      loan_status: "Pendiente" | "Aprobado" | "Devuelto" | "Rechazado"
      user_role: "Administrador" | "Usuario" | "Consultor"
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
      document_status: ["Activo", "Transferido", "Eliminado"],
      document_support: ["Papel", "Digital"],
      elimination_status: ["Pendiente", "En_revision", "Eliminado"],
      loan_status: ["Pendiente", "Aprobado", "Devuelto", "Rechazado"],
      user_role: ["Administrador", "Usuario", "Consultor"],
    },
  },
} as const
