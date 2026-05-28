import type { AgentType } from "@/lib/agent/system-prompt";
import { AGENT_PROFILES } from "@/lib/agent/profiles";
import { AgentSprite, type SpriteAnimation } from "./agent-sprite";

// The workspace background is one 1920×640 image with three 640×640 panels
// arranged Atlas | Vela | Iris. Using background-size: 300% 100% means
// background-position-x picks which panel shows.
const WORKSPACE_URL = "/sprites/workspace_1-bg.png";

const PANEL_X: Record<AgentType, string> = {
  atlas: "0%",
  vela: "50%",
  iris: "100%",
};

const DEFAULT_SPRITE_SIZE_PX = 220;

export function AgentWorkspace({
  agentType,
  animation,
  showName = false,
  spriteSize = DEFAULT_SPRITE_SIZE_PX,
}: {
  agentType: AgentType;
  animation: SpriteAnimation;
  showName?: boolean;
  spriteSize?: number;
}) {
  const profile = AGENT_PROFILES[agentType];
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative aspect-square w-full max-w-[640px] overflow-hidden rounded-lg border"
        style={{
          backgroundImage: `url('${WORKSPACE_URL}')`,
          backgroundSize: "300% 100%",
          backgroundPosition: `${PANEL_X[agentType]} 0%`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      >
        <div className="absolute inset-x-0 bottom-[8%] flex justify-center">
          <AgentSprite
            agentType={agentType}
            animation={animation}
            size={spriteSize}
          />
        </div>
      </div>
      {showName && (
        <div className="text-center">
          <p className="text-2xl font-semibold tracking-tight">
            {profile.name}
          </p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {profile.doctrineName}
          </p>
        </div>
      )}
    </div>
  );
}
