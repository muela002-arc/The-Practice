import type { AgentType } from "@/lib/agent/system-prompt";

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          user_id: string;
          agent_type: AgentType;
          created_at: string;
          died_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_type: AgentType;
          created_at?: string;
          died_at?: string | null;
        };
        Update: {
          died_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string;
          title: string;
          goal: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id: string;
          title: string;
          goal?: string;  // server default '' — backfill-safe; new rows should set explicitly
          description: string;
          created_at?: string;
        };
        // Immutable in M3. M4 may relax this when completion semantics ship.
        Update: Record<string, never>;
        Relationships: [];
      };
      operations: {
        Row: {
          id: string;
          project_id: string;
          ordinal: number;
          title: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          ordinal: number;
          title: string;
          description: string;
          created_at?: string;
        };
        // Immutable in M3. M4 adds completion → relax then.
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_project_with_operations: {
        Args: {
          p_user_id: string;
          p_agent_id: string;
          p_title: string;
          p_goal: string;
          p_description: string;
          p_operations: { title: string; description: string }[];
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
