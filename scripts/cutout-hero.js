/* eslint-disable @typescript-eslint/no-require-imports */
// Run with: node scripts/cutout-hero.js <source-image>
// A standalone CommonJS Node utility, not part of the Next.js bundle.
//
// One-off utility: strip the checkerboard "transparency" pattern Gemini paints
// into its output, then trim and save as WebP for the homepage hero.
//
// The PNG reports an alpha channel but nothing is actually transparent — the
// checkerboard is real pixels. Those squares are pure neutral grey (~206) and
// white, whereas the model's hijab and skin are all tinted, so requiring a very
// low channel spread separates background from subject without eating her.
const sharp = require("sharp");
const path = require("path");

const SRC = process.argv[2];
const OUT = path.join(__dirname, "..", "public", "images", "hero-person-v3.webp");

// The squares are ~206 grey and pure white, but the anti-aliased seam between
// them lands in between. Treating those mid values as subject walls the flood
// fill inside a single square, so the whole light-neutral range is accepted.
// Her skin, cream hijab and mint blouse are all tinted, so the spread test
// still keeps them.
// Measured on the source: the checkerboard squares and the seams between them
// are pure neutral (spread 0-3), while the pale highlights on the mint sleeve
// sit at spread 10-20. A threshold of 5 removes all of the background without
// biting into the fabric, which a looser 12 did.
const NEUTRAL_SPREAD = 5; // max(r,g,b) - min(r,g,b) allowed for background
const NEUTRAL_MIN = 190;

async function main() {
  if (!SRC) throw new Error("Pass the source image path as the first argument");
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const isBackground = (idx) => {
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    return max - min <= NEUTRAL_SPREAD && min >= NEUTRAL_MIN;
  };

  const visited = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    if (!isBackground(p * channels)) return;
    visited[p] = 1;
    stack.push(p);
  };

  // Seed only from the border, so white areas inside the banknotes are never
  // reached — a flood fill cannot cross her hands or the notes themselves.
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }

  let cleared = 0;
  while (stack.length) {
    const p = stack.pop();
    data[p * channels + 3] = 0;
    cleared += 1;
    const x = p % width;
    const y = (p / width) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  console.log(`cleared ${cleared} of ${width * height} px (${((100 * cleared) / (width * height)).toFixed(1)}%)`);

  const trimmed = await sharp(data, { raw: { width, height, channels } })
    .png()
    .trim({ threshold: 10 })
    .toBuffer();

  await sharp(trimmed).webp({ quality: 92 }).toFile(OUT);
  const meta = await sharp(OUT).metadata();
  console.log(`saved ${OUT} — ${meta.width}x${meta.height}, alpha: ${meta.hasAlpha}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
