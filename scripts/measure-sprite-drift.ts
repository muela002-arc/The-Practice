// Measure per-frame horizontal character drift in each idle sequence.
// For each of the four idle frames (row 0, cols 0..3) of each agent sheet:
//   - scan every pixel of the cell
//   - find leftmost/rightmost pixel with alpha > 10
//   - take in-cell center = (leftmost + rightmost) / 2
// Frame 0's in-cell center is the reference. The offset for frame N is the
// translateX (in source pixels) needed to align frame N's character with
// frame 0's: offset_N = center_0 - center_N. Positive = shift right.
//
// Run:  node --experimental-strip-types scripts/measure-sprite-drift.ts

import sharp from "sharp";
import { join } from "node:path";

const SHEETS: ReadonlyArray<{ agent: "atlas" | "vela" | "iris"; path: string }> = [
  { agent: "atlas", path: "public/sprites/atlas_1-sprites_png.png" },
  { agent: "vela", path: "public/sprites/vela_2-sprites.png" },
  { agent: "iris", path: "public/sprites/iris_2-sprites.png" },
];

const ALPHA_THRESHOLD = 10;

type FrameStats = {
  col: number;
  leftmostInCell: number;
  rightmostInCell: number;
  centerInCell: number;
};

async function measureSheet(
  agent: string,
  path: string,
): Promise<{ centers: number[]; cellW: number; sheetW: number; sheetH: number }> {
  const { data, info } = await sharp(join(process.cwd(), path))
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cellW = info.width / 4;
  const cellH = info.height / 3;

  console.log(`\n=== ${agent} (sheet ${info.width}×${info.height}, cell ${cellW.toFixed(3)}×${cellH.toFixed(3)}) ===`);
  console.log("Frame stats (positions are in-cell, in SOURCE pixels):");

  const stats: FrameStats[] = [];
  for (let col = 0; col < 4; col++) {
    const x0 = Math.round(col * cellW);
    const x1 = Math.round((col + 1) * cellW);
    const y0 = 0;
    const y1 = Math.round(cellH);

    let minX = x1;
    let maxX = x0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * info.width + x) * info.channels;
        const a = data[i + 3];
        if (a !== undefined && a > ALPHA_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    const leftmostInCell = minX - x0;
    const rightmostInCell = maxX - x0;
    const centerInCell = (leftmostInCell + rightmostInCell) / 2;
    stats.push({ col, leftmostInCell, rightmostInCell, centerInCell });
    console.log(
      `  idle-${col + 1} (col ${col}): leftmost=${leftmostInCell.toString().padStart(3)}, rightmost=${rightmostInCell.toString().padStart(3)}, center=${centerInCell.toFixed(2).padStart(6)}`,
    );
  }

  const ref = stats[0]!.centerInCell;
  console.log(`\nReference: idle-1 center = ${ref.toFixed(2)}`);
  console.log("Frame-0-anchored offsets (translateX in source pixels):");
  for (const s of stats) {
    const offset = ref - s.centerInCell;
    const sign = offset >= 0 ? "+" : "";
    console.log(`  idle-${s.col + 1}: ${sign}${offset.toFixed(2)} px  (${offset > 0 ? "shift RIGHT" : offset < 0 ? "shift LEFT" : "reference"})`);
  }

  return {
    centers: stats.map((s) => s.centerInCell),
    cellW,
    sheetW: info.width,
    sheetH: info.height,
  };
}

const results: Record<string, { offsets: number[]; cellW: number }> = {};
for (const { agent, path } of SHEETS) {
  const r = await measureSheet(agent, path);
  const ref = r.centers[0]!;
  const offsets = r.centers.map((c) => ref - c);
  results[agent] = { offsets, cellW: r.cellW };
}

console.log("\n=== Summary: paste into FRAME_X_OFFSETS_SRC ===");
for (const agent of Object.keys(results)) {
  const { offsets } = results[agent]!;
  console.log(`  ${agent}: {`);
  for (let i = 0; i < 4; i++) {
    console.log(`    "idle-${i + 1}": ${offsets[i]!.toFixed(2)},`);
  }
  console.log("  },");
}
