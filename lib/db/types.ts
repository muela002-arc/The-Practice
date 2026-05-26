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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
