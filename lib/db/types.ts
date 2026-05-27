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
          xp: number;
          level: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_type: AgentType;
          created_at?: string;
          died_at?: string | null;
          xp?: number;
          level?: number;
        };
        // M4 relaxes Update to allow the session-submission RPC to mutate
        // xp + level. Other columns stay outside the typed Update path even
        // though the RLS policy is broader — application discipline.
        Update: {
          xp?: number;
          level?: number;
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
        // M4 keeps operations immutable. Completion is derived from sessions
        // (existence of a session row with operation_id = this op's id).
        Update: Record<string, never>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          operation_id: string;
          transcript: string;
          output: string;
          reflection: string;
          replay_narrative: string;
          scar_text: string | null;
          scar_source_excerpt: string | null;
          wisdom_text: string | null;
          wisdom_source_excerpt: string | null;
          xp_delta: number;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          operation_id: string;
          transcript: string;
          output: string;
          reflection: string;
          replay_narrative: string;
          scar_text?: string | null;
          scar_source_excerpt?: string | null;
          wisdom_text?: string | null;
          wisdom_source_excerpt?: string | null;
          xp_delta?: number;
          submitted_at?: string;
        };
        // Sessions are immutable once submitted. V2 may relax for replay
        // regeneration if voice drift surfaces.
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
      create_session_with_completion: {
        Args: {
          p_operation_id: string;
          p_transcript: string;
          p_output: string;
          p_reflection: string;
          p_replay_narrative: string;
          p_scar_text: string | null;
          p_scar_source_excerpt: string | null;
          p_wisdom_text: string | null;
          p_wisdom_source_excerpt: string | null;
          p_xp_delta: number;
        };
        Returns: {
          session: {
            id: string;
            operation_id: string;
            transcript: string;
            output: string;
            reflection: string;
            replay_narrative: string;
            scar_text: string | null;
            scar_source_excerpt: string | null;
            wisdom_text: string | null;
            wisdom_source_excerpt: string | null;
            xp_delta: number;
            submitted_at: string;
          };
          agent: {
            xp: number;
            level: number;
            leveled_up: boolean;
          };
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
