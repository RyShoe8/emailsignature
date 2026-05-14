/**
 * One-off: chroma-key near #F8FAFC from JPEG → transparent PNG for header logo.
 * Run: node scripts/generate-transparent-logo.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const inputPath = path.join(root, 'public/images/tailnote-logo.jpg');
const outputPath = path.join(root, 'public/images/tailnote-logo.png');

const BG = { r: 248, g: 250, b: 252 };

async function main() {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  if (channels !== 4) throw new Error(`Expected 4 channels, got ${channels}`);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dr = r - BG.r;
    const dg = g - BG.g;
    const db = b - BG.b;
    const dist = Math.hypot(dr, dg, db);
    // Background + light anti-alias ring; keep logo colors (blues, teals, mint, dark text)
    if (dist < 38 || (r > 238 && g > 240 && b > 244 && (r + g + b) / 3 > 246)) {
      data[i + 3] = 0;
    }
  }

  await sharp(Buffer.from(data), { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.info('Wrote', outputPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
