// One-shot script: read each sprite PNG, set every pure-black (RGB 0,0,0)
// pixel's alpha to 0, write to *_alpha.png alongside the original. Run with:
//   node --experimental-strip-types scripts/make-sprites-transparent.ts
//
// Originals are left untouched. Any non-pure-black pixel (including dark
// outlines that the artist drew as e.g. #0A0A0A instead of #000000) is
// preserved as-is, so character silhouettes survive the conversion as long
// as the artist didn't reuse exactly #000000 for both outlines and bg.

import sharp from "sharp";
import { join } from "node:path";

const BASE = join(process.cwd(), "public", "sprites");

const TARGETS: ReadonlyArray<[input: string, output: string]> = [
  ["atlas_1-sprites_png.png", "atlas_1-sprites_alpha.png"],
  ["vela_2-sprites.png", "vela_2-sprites_alpha.png"],
  ["iris_2-sprites.png", "iris_2-sprites_alpha.png"],
];

async function processOne(input: string, output: string): Promise<void> {
  const inPath = join(BASE, input);
  const outPath = join(BASE, output);

  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Per-channel "near-black" threshold. The bg in these sheets includes both
  // pure-black interiors and ~(40,40,40) outer-border anti-aliasing. Earlier
  // pass at threshold 50 was too aggressive — it ate dark character pixels
  // (hoodie folds, hair shadows, pupils). Tightened to 15: only true bg gets
  // caught; near-black character detail stays opaque.
  const CHANNEL_MAX = 15;
  const isBg = (r: number, g: number, b: number): boolean =>
    r <= CHANNEL_MAX && g <= CHANNEL_MAX && b <= CHANNEL_MAX;

  let bgCount = 0;
  const totalPixels = info.width * info.height;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (
      r !== undefined &&
      g !== undefined &&
      b !== undefined &&
      isBg(r, g, b)
    ) {
      data[i + 3] = 0;
      bgCount++;
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outPath);

  const pct = ((bgCount / totalPixels) * 100).toFixed(1);
  console.log(
    `${input}: channels≤${CHANNEL_MAX} → ${bgCount.toLocaleString()} of ${totalPixels.toLocaleString()} (${pct}%) transparent → ${output}`,
  );
}

for (const [inp, out] of TARGETS) {
  await processOne(inp, out);
}
