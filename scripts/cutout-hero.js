/* eslint-disable @typescript-eslint/no-require-imports */
// Run with: node scripts/cutout-hero.js <source-image>
// A standalone CommonJS Node utility, not part of the Next.js bundle.
//
// Strips the checkerboard "transparency" pattern Gemini paints into its output.
// The PNG reports an alpha channel but nothing is actually transparent — the
// squares are real pixels. Those squares and the seams between them are pure
// neutral (measured spread 0-3), whereas the pale highlights on the model's
// mint sleeve measure 10-20, so a tight spread threshold separates them.
//
// Cutting at 2x and scaling back down is what makes the edge smooth: a flood
// fill can only ever mark a pixel fully in or fully out, so cutting at the
// final size leaves hard stair-steps. Doing it at double resolution and then
// downsampling turns those steps into genuine partial alpha.
const sharp = require("sharp");
const path = require("path");

const SRC = process.argv[2];
const OUT = path.join(__dirname, "..", "public", "images", "hero-person-v3.webp");

const NEUTRAL_SPREAD = 5; // max(r,g,b) - min(r,g,b) allowed for background
const NEUTRAL_MIN = 190;
const SUPERSAMPLE = 2;
// Pixels right on the boundary are blended with the white/grey squares, so they
// read as a pale fringe against the navy hero. Pulling the edge in by roughly a
// final-resolution pixel removes that halo before the edge is feathered.
const ERODE_PASSES = 2;

async function main() {
  if (!SRC) throw new Error("Pass the source image path as the first argument");

  const meta = await sharp(SRC).metadata();
  const width = meta.width * SUPERSAMPLE;
  const height = meta.height * SUPERSAMPLE;

  const { data, info } = await sharp(SRC)
    .resize({ width, height, kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;

  const isBackground = (idx) => {
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    return max - min <= NEUTRAL_SPREAD && min >= NEUTRAL_MIN;
  };

  // Flood fill inward from the border only, so white areas inside the banknotes
  // are never reached — the fill cannot cross her hands or the notes.
  const background = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (background[p]) return;
    if (!isBackground(p * channels)) return;
    background[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    const y = (p / width) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  // Grow the background into the contaminated boundary ring.
  for (let pass = 0; pass < ERODE_PASSES; pass++) {
    const grown = background.slice();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        if (background[p]) continue;
        const up = y > 0 && background[p - width];
        const down = y < height - 1 && background[p + width];
        const left = x > 0 && background[p - 1];
        const right = x < width - 1 && background[p + 1];
        if (up || down || left || right) grown[p] = 1;
      }
    }
    background.set(grown);
  }

  const cleared = background.reduce((total, value) => total + value, 0);
  console.log(`cleared ${((100 * cleared) / (width * height)).toFixed(1)}% at ${width}x${height}`);

  // Average each SUPERSAMPLE x SUPERSAMPLE block of the mask down to one pixel.
  // Doing this by hand rather than through resize is deliberate: sharp leaves a
  // joined alpha channel untouched when scaling, which is what produced a
  // perfectly hard, stair-stepped edge. Averaging gives real partial coverage.
  const outWidth = meta.width;
  const outHeight = meta.height;
  const alpha = Buffer.alloc(outWidth * outHeight);
  const perBlock = SUPERSAMPLE * SUPERSAMPLE;
  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      let opaque = 0;
      for (let dy = 0; dy < SUPERSAMPLE; dy++) {
        for (let dx = 0; dx < SUPERSAMPLE; dx++) {
          const sx = x * SUPERSAMPLE + dx;
          const sy = y * SUPERSAMPLE + dy;
          if (sx < width && sy < height && !background[sy * width + sx]) opaque += 1;
        }
      }
      alpha[y * outWidth + x] = Math.round((opaque / perBlock) * 255);
    }
  }

  // A light blur spreads coverage across one more pixel, so curves read smooth
  // rather than showing the few discrete steps a 2x mask alone can produce.
  // Done by hand: passing a single-channel mask through sharp's blur returns it
  // as 3-channel greyscale, and reading that back as one channel silently
  // misaligns every row, which striped the whole cutout.
  const feathered = Buffer.alloc(outWidth * outHeight);
  const radius = 1;
  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      let total = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= outHeight) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= outWidth) continue;
          total += alpha[ny * outWidth + nx];
          count += 1;
        }
      }
      feathered[y * outWidth + x] = Math.round(total / count);
    }
  }

  const rgb = await sharp(SRC).removeAlpha().raw().toBuffer();

  const composed = await sharp(rgb, { raw: { width: outWidth, height: outHeight, channels: 3 } })
    .joinChannel(feathered, { raw: { width: outWidth, height: outHeight, channels: 1 } })
    .png()
    .toBuffer();

  // Crop from the alpha, not sharp's trim(): the discarded background is still
  // present in the RGB underneath the transparency, so trim() reads that
  // checkerboard as content and cuts to the wrong box.
  let minX = outWidth, minY = outHeight, maxX = -1, maxY = -1;
  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      if (feathered[y * outWidth + x] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("Everything was treated as background — loosen the thresholds");

  await sharp(composed)
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .webp({ quality: 94, alphaQuality: 100 })
    .toFile(OUT);

  const out = await sharp(OUT).metadata();
  const { data: check, info: checkInfo } = await sharp(OUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let soft = 0;
  for (let i = 3; i < check.length; i += checkInfo.channels) {
    if (check[i] > 8 && check[i] < 247) soft += 1;
  }
  console.log(`saved ${out.width}x${out.height} — ${((100 * soft) / (out.width * out.height)).toFixed(2)}% soft edge pixels`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
