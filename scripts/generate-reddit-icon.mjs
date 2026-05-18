/**
 * One-off generator for public/email-assets/icon-reddit.png
 * Bold white Reddit mark on #FF4500 (matches Facebook/Discord email icons).
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/email-assets/icon-reddit.png');

// Simple Icons Reddit path (24 viewBox), scaled on brand orange square.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" fill="#FF4500"/>
  <g transform="translate(24 25) scale(1.72) translate(-12 -12)">
    <path fill="#FFFFFF" d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.03 4.875-6.004 4.875-2.688 0-5.03-1.558-6.112-3.811a3.113 3.113 0 0 1-1.04-.167 1.75 1.75 0 0 1-1.448-1.744c0-.968.786-1.754 1.754-1.754.477 0 .9.182 1.207.491 1.227-.87 2.944-1.432 4.846-1.495l.893-4.195c.017-.077.029-.152.043-.223zm-8.96 6.871a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm4.908 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z"/>
  </g>
</svg>`;

const png = await sharp(Buffer.from(svg)).resize(24, 24).png().toBuffer();
writeFileSync(outPath, png);
console.log('Wrote', outPath, `(${png.length} bytes)`);
