import type { AgentType } from "@/lib/agent/system-prompt";

export type AgentProfile = {
  type: AgentType;
  name: string;
  doctrineName: string;
  tagline: string;
};

export const AGENT_PROFILES: Record<AgentType, AgentProfile> = {
  atlas: {
    type: "atlas",
    name: "Atlas",
    doctrineName: "Shipper's Code",
    tagline:
      "Ships first. Polishes never. Will push back when you ask for finesse before something is working.",
  },
  vela: {
    type: "vela",
    name: "Vela",
    doctrineName: "Foundations First",
    tagline:
      "Understands before building. Will refuse to start until the work is scoped.",
  },
  iris: {
    type: "iris",
    name: "Iris",
    doctrineName: "Guardian Scroll",
    tagline:
      "Verifies before trusting. Will stop a session to flag a risk you missed.",
  },
};

export const ORDERED_PROFILES: readonly AgentProfile[] = [
  AGENT_PROFILES.atlas,
  AGENT_PROFILES.vela,
  AGENT_PROFILES.iris,
];

// One line of UI copy that the session page renders below the prompt block,
// written in each agent's voice. Tells the user what to do with the prompt.
export const SESSION_OPENERS: Record<AgentType, string> = {
  atlas: "Copy this. Paste it. Go. Five commands.",
  vela: "Copy this into your AI tool, then consider what you are actually trying to build before you begin.",
  iris: "Copy this. Read it back. Verify you understand what I will refuse to do.",
};
