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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      candidate_payments: {
        Row: {
          candidate_id: string
          created_at: string
          data: string
          id: string
          shuma: number
          tenant_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          data?: string
          id?: string
          shuma: number
          tenant_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          data?: string
          id?: string
          shuma?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_payments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          certifikata_shendetsore: string | null
          created_at: string
          data_lindjes: string | null
          data_regjistrimit: string
          dokumente_terhequr: boolean
          emri: string
          emri_babait: string | null
          id: string
          instructor_id: string | null
          kategoria: string
          mbiemri: string
          numri_personal: string | null
          numri_regjistrimit: string
          shenimet: string | null
          shuma_marreveshjes: number
          statusi: Database["public"]["Enums"]["candidate_status"]
          telefon: string | null
          tenant_id: string
          updated_at: string
          vendi: string | null
          vendlindja: string | null
          vertetimi_printuar: boolean
        }
        Insert: {
          certifikata_shendetsore?: string | null
          created_at?: string
          data_lindjes?: string | null
          data_regjistrimit?: string
          dokumente_terhequr?: boolean
          emri: string
          emri_babait?: string | null
          id?: string
          instructor_id?: string | null
          kategoria?: string
          mbiemri: string
          numri_personal?: string | null
          numri_regjistrimit: string
          shenimet?: string | null
          shuma_marreveshjes?: number
          statusi?: Database["public"]["Enums"]["candidate_status"]
          telefon?: string | null
          tenant_id: string
          updated_at?: string
          vendi?: string | null
          vendlindja?: string | null
          vertetimi_printuar?: boolean
        }
        Update: {
          certifikata_shendetsore?: string | null
          created_at?: string
          data_lindjes?: string | null
          data_regjistrimit?: string
          dokumente_terhequr?: boolean
          emri?: string
          emri_babait?: string | null
          id?: string
          instructor_id?: string | null
          kategoria?: string
          mbiemri?: string
          numri_personal?: string | null
          numri_regjistrimit?: string
          shenimet?: string | null
          shuma_marreveshjes?: number
          statusi?: Database["public"]["Enums"]["candidate_status"]
          telefon?: string | null
          tenant_id?: string
          updated_at?: string
          vendi?: string | null
          vendlindja?: string | null
          vertetimi_printuar?: boolean
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          full_name: string
          health_certificate_date: string | null
          health_certificate_expiry_date: string | null
          id: string
          license_date: string | null
          license_expiry_date: string | null
          license_number: string | null
          personal_number: string | null
          photo_url: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          health_certificate_date?: string | null
          health_certificate_expiry_date?: string | null
          id?: string
          license_date?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          personal_number?: string | null
          photo_url?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          health_certificate_date?: string | null
          health_certificate_expiry_date?: string | null
          id?: string
          license_date?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          personal_number?: string | null
          photo_url?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          category: string
          created_at: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          license_number: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          license_number: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          license_number?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          category: string
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          status: Database["public"]["Enums"]["registration_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          status?: Database["public"]["Enums"]["registration_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["registration_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          categories: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          categories?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          role: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          categories?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string
          director_name: string | null
          domain: string | null
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          primary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          director_name?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          director_name?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          created_at: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_services: {
        Row: {
          created_at: string
          id: string
          next_service_date: string | null
          next_service_km: number | null
          notes: string | null
          service_date: string | null
          service_km: number | null
          service_type: string
          tenant_id: string
          updated_at: string
          vehicle_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_service_date?: string | null
          next_service_km?: number | null
          notes?: string | null
          service_date?: string | null
          service_km?: number | null
          service_type: string
          tenant_id: string
          updated_at?: string
          vehicle_name: string
        }
        Update: {
          created_at?: string
          id?: string
          next_service_date?: string | null
          next_service_km?: number | null
          notes?: string | null
          service_date?: string | null
          service_km?: number | null
          service_type?: string
          tenant_id?: string
          updated_at?: string
          vehicle_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          attestation_expiry_date: string | null
          attestation_number: string | null
          created_at: string
          id: string
          inspection_date: string | null
          inspection_expiry_date: string | null
          name: string
          photo_url: string | null
          plate_number: string
          registration_date: string | null
          registration_expiry_date: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attestation_expiry_date?: string | null
          attestation_number?: string | null
          created_at?: string
          id?: string
          inspection_date?: string | null
          inspection_expiry_date?: string | null
          name: string
          photo_url?: string | null
          plate_number: string
          registration_date?: string | null
          registration_expiry_date?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attestation_expiry_date?: string | null
          attestation_number?: string | null
          created_at?: string
          id?: string
          inspection_date?: string | null
          inspection_expiry_date?: string | null
          name?: string
          photo_url?: string | null
          plate_number?: string
          registration_date?: string | null
          registration_expiry_date?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tenants_public: {
        Row: {
          domain: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          primary_color: string | null
          slug: string | null
        }
        Insert: {
          domain?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          slug?: string | null
        }
        Update: {
          domain?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_existing_user_to_my_tenant: {
        Args: { _as_admin: boolean; _target_user_id: string }
        Returns: undefined
      }
      create_tenant_with_admin: {
        Args: {
          _address: string
          _admin_user_id: string
          _director_name: string
          _domain: string
          _email: string
          _name: string
          _phone: string
          _primary_color: string
          _slug: string
        }
        Returns: string
      }
      get_all_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          is_admin: boolean
          user_id: string
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      grant_admin_role: {
        Args: { _target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_instructor: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      list_all_tenants_with_stats: {
        Args: never
        Returns: {
          address: string
          admin_count: number
          created_at: string
          director_name: string
          domain: string
          email: string
          employees_count: number
          id: string
          is_active: boolean
          logo_url: string
          name: string
          phone: string
          primary_color: string
          slug: string
          vehicles_count: number
        }[]
      }
      list_instructors_in_my_tenant: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      list_users_for_super_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          is_super_admin: boolean
          tenant_count: number
          user_id: string
        }[]
      }
      list_users_in_my_tenant: {
        Args: never
        Returns: {
          created_at: string
          email: string
          is_admin: boolean
          is_instructor: boolean
          user_id: string
        }[]
      }
      remove_user_from_my_tenant: {
        Args: { _target_user_id: string }
        Returns: undefined
      }
      revoke_admin_role: {
        Args: { _target_user_id: string }
        Returns: undefined
      }
      set_tenant_active: {
        Args: { _is_active: boolean; _tenant_id: string }
        Returns: undefined
      }
      user_belongs_to_tenant: { Args: { _tenant_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin" | "instructor"
      candidate_status: "regjistuar" | "ne_proces" | "kaluar" | "deshtur"
      registration_status: "new" | "contacted" | "enrolled" | "rejected"
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
      app_role: ["admin", "user", "super_admin", "instructor"],
      candidate_status: ["regjistuar", "ne_proces", "kaluar", "deshtur"],
      registration_status: ["new", "contacted", "enrolled", "rejected"],
    },
  },
} as const
