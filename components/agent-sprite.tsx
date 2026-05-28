"use client";

import { useEffect, useState } from "react";
import type { AgentType } from "@/lib/agent/system-prompt";

export type SpriteAnimation =
  | "idle"
  | "working"
  | "victory"
  | "scar"
  | "walking";

type Frame =
  | "idle-1"
  | "idle-2"
  | "idle-3"
  | "idle-4"
  | "action-1"
  | "action-2"
  | "victory"
  | "scar"
  | "move-1"
  | "move-2"
  | "special";

// Sprite sheet grid: 4 columns × 3 rows of 320×320 cells. The cell at
// (3, 2) is intentionally empty per the asset spec.
const FRAME_GRID: Record<Frame, { col: number; row: number }> = {
  "idle-1": { col: 0, row: 0 },
  "idle-2": { col: 1, row: 0 },
  "idle-3": { col: 2, row: 0 },
  "idle-4": { col: 3, row: 0 },
  "action-1": { col: 0, row: 1 },
  "action-2": { col: 1, row: 1 },
  victory: { col: 2, row: 1 },
  scar: { col: 3, row: 1 },
  "move-1": { col: 0, row: 2 },
  "move-2": { col: 1, row: 2 },
  special: { col: 2, row: 2 },
};

type SequenceMode = "loop" | "one-shot";
type Sequence = {
  frames: readonly Frame[];
  frameMs: number;
  mode: SequenceMode;
};

// one-shot sequences play through once and then transition to idle.
const SEQUENCES: Record<SpriteAnimation, Sequence> = {
  idle: {
    frames: ["idle-1", "idle-2", "idle-3", "idle-4"],
    frameMs: 400,
    mode: "loop",
  },
  working: {
    frames: ["action-1", "action-2"],
    frameMs: 400,
    mode: "loop",
  },
  victory: {
    frames: ["idle-1", "victory", "victory", "idle-1"],
    frameMs: 400,
    mode: "one-shot",
  },
  scar: {
    frames: ["scar"],
    frameMs: 2000,
    mode: "one-shot",
  },
  walking: {
    frames: ["move-1", "move-2"],
    frameMs: 400,
    mode: "loop",
  },
};

// Sprite sheets carry their own alpha channels (processed via remove.bg).
// No blend mode or threshold post-processing needed.
const SPRITE_URL: Record<AgentType, string> = {
  atlas: "/sprites/atlas_1-sprites_png.png",
  vela: "/sprites/vela_2-sprites.png",
  iris: "/sprites/iris_2-sprites.png",
};

// Cell width in the source PNG, per agent. Slight variation because remove.bg
// outputs aren't exactly divisible (Atlas/Vela 577px → 144.25, Iris 576px →
// 144.00). Used to convert per-frame source-pixel drift into display pixels.
const SOURCE_CELL_WIDTH: Record<AgentType, number> = {
  atlas: 144.25,
  vela: 144.25,
  iris: 144.0,
};

// Per-frame X compensation in SOURCE pixels. Frame-0-anchored: idle-1 is
// the reference (offset 0). For each subsequent idle frame, the value is
// how far that frame's character bounding-box center sits to the LEFT of
// frame 0's bounding-box center, so translateX(+value) shifts it right to
// align with frame 0.
//
// Measured by scripts/measure-sprite-drift.ts (leftmost/rightmost opaque
// pixel per cell with alpha > 10, then center = (left + right) / 2).
//
// Only idle frames have entries. Other frames render at translateX(0).
const FRAME_X_OFFSETS_SRC: Record<AgentType, Partial<Record<Frame, number>>> = {
  atlas: {
    "idle-1": 0,
    "idle-2": 4.0,
    "idle-3": 3.0,
    "idle-4": 7.5,
  },
  vela: {
    "idle-1": 0,
    "idle-2": 5.0,
    "idle-3": 7.0,
    "idle-4": 6.0,
  },
  iris: {
    "idle-1": 0,
    "idle-2": 4.5,
    "idle-3": 13.5,
    "idle-4": 10.5,
  },
};

export function AgentSprite({
  agentType,
  animation,
  size = 80,
}: {
  agentType: AgentType;
  animation: SpriteAnimation;
  size?: number;
}) {
  const [state, setState] = useState<{
    propAnim: SpriteAnimation;
    activeAnim: SpriteAnimation;
    idx: number;
  }>({ propAnim: animation, activeAnim: animation, idx: 0 });

  // Reset on prop change. Calling setState during render is the React-
  // recommended pattern for adjusting state to a prop change.
  if (state.propAnim !== animation) {
    setState({ propAnim: animation, activeAnim: animation, idx: 0 });
  }

  // Advance frames; one-shot sequences fall through to idle when done.
  useEffect(() => {
    const seq = SEQUENCES[state.activeAnim];
    const id = setInterval(() => {
      setState((s) => {
        const current = SEQUENCES[s.activeAnim];
        const next = s.idx + 1;
        if (next >= current.frames.length) {
          if (current.mode === "one-shot" && s.activeAnim !== "idle") {
            return { ...s, activeAnim: "idle", idx: 0 };
          }
          return { ...s, idx: 0 };
        }
        return { ...s, idx: next };
      });
    }, seq.frameMs);
    return () => clearInterval(id);
  }, [state.activeAnim]);

  const seq = SEQUENCES[state.activeAnim];
  const frameName = seq.frames[state.idx];
  const grid = FRAME_GRID[frameName];

  // Per-frame X compensation: source-pixel offset scaled to display pixels.
  const offsetSrc = FRAME_X_OFFSETS_SRC[agentType][frameName] ?? 0;
  const scale = size / SOURCE_CELL_WIDTH[agentType];
  const compensationPx = offsetSrc * scale;

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        backgroundImage: `url('${SPRITE_URL[agentType]}')`,
        backgroundSize: `${4 * size}px ${3 * size}px`,
        backgroundPosition: `-${grid.col * size}px -${grid.row * size}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        transform: `translateX(${compensationPx.toFixed(2)}px)`,
      }}
    />
  );
}
