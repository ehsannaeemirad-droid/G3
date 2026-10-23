#!/usr/bin/env node
/**
 * Generate PWA icons + OG image. Dev-time only (pngjs / sharp are devDependencies).
 *   npm run icons
 *
 * Outputs:
 *   assets/icons/icon-192.png          192x192  (any)
 *   assets/icons/icon-512.png          512x512  (any)
 *   assets/icons/icon-maskable-512.png 512x512  (maskable: full-bleed bg, content inset 20%)
 *   assets/icons/og-image.png          1200x630 (Open Graph share card)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'icons');
fs.mkdirSync(OUT, { recursive: true });

const PURPLE = [0x7c, 0x3a, 0xed]; // #7c3aed
const WHITE = [255, 255, 255];
const SS = 4; // supersampling factor (render at 4x, box-filter down)

/* ------------------------------------------------------------------ *
 * The "G": white ring (open on the right) + horizontal crossbar.
 * Coordinates are logical (0..size); scale shrinks it for maskable.
 * ------------------------------------------------------------------ */
function inG(x, y, size, scale = 1) {
  const cx = size / 2;
  const cy = size / 2;
  const dx = (x - cx) / scale;
  const dy = (y - cy) / scale;
  const R = size * 0.30;          // outer radius
  const T = size * 0.08;          // ring thickness
  const r = R - T;                // inner radius
  const d = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx); // 0 = right (screen coords, y down)
  const inGap = ang > -0.35 && ang < 0.35;
  const ring = d >= r && d <= R && !inGap;
  const bar = Math.abs(dy) <= T / 2 && dx >= size * 0.05 && dx <= R;
  return ring || bar;
}

function inRoundedRect(x, y, size, rr) {
  if (x < 0 || y < 0 || x > size || y > size) return false;
  const nx = Math.min(x, size - x);
  const ny = Math.min(y, size - y);
  if (nx >= rr || ny >= rr) return true;
  const ax = rr - nx;
  const ay = rr - ny;
  return ax * ax + ay * ay <= rr * rr;
}

function downsample(src, size) {
  const out = new PNG({ width: size, height: size });
  const S = src.width;
  const n = SS * SS;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let ra = 0, ga = 0, ba = 0, aa = 0;
      for (let j = 0; j < SS; j++) {
        for (let i = 0; i < SS; i++) {
          const idx = ((y * SS + j) * S + (x * SS + i)) << 2;
          const a = src.data[idx + 3];
          ra += src.data[idx] * a;
          ga += src.data[idx + 1] * a;
          ba += src.data[idx + 2] * a;
          aa += a;
        }
      }
      const o = (y * size + x) << 2;
      if (aa === 0) { out.data[o + 3] = 0; continue; }
      out.data[o] = Math.round(ra / aa);
      out.data[o + 1] = Math.round(ga / aa);
      out.data[o + 2] = Math.round(ba / aa);
      out.data[o + 3] = Math.round(aa / n);
    }
  }
  return out;
}

function renderIcon(size, { maskable = false } = {}) {
  const S = size * SS;
  const src = new PNG({ width: S, height: S });
  const rr = maskable ? 0 : size * 0.04;   // 4% corner radius (full bleed for maskable)
  const gScale = maskable ? 0.8 : 1;       // content inset 20% for the maskable safe zone
  for (let Y = 0; Y < S; Y++) {
    for (let X = 0; X < S; X++) {
      const x = (X + 0.5) / SS;
      const y = (Y + 0.5) / SS;
      const onBg = maskable ? true : inRoundedRect(x, y, size, rr);
      const isWhite = onBg && inG(x, y, size, gScale);
      const c = isWhite ? WHITE : PURPLE;
      const idx = (Y * S + X) << 2;
      src.data[idx] = c[0];
      src.data[idx + 1] = c[1];
      src.data[idx + 2] = c[2];
      src.data[idx + 3] = onBg ? 255 : 0;
    }
  }
  return downsample(src, size);
}

function writePng(png, name) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, PNG.sync.write(png));
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`  ✓ ${name}  ${png.width}x${png.height}  ${kb} KB`);
}

/* ------------------------------------------------------------------ *
 * OG image (1200x630): purple card, G on the left, Persian text right.
 * Text is drawn as SVG so sharp can rasterize it with proper shaping.
 * ------------------------------------------------------------------ */
function ogSvg() {
  const W = 1200, H = 630;
  const gcx = W * 0.35, gcy = H / 2;
  const gSize = 300;
  const R = gSize * 0.30;
  const T = gSize * 0.08;
  const r = R - T;
  const C = 2 * Math.PI * R;
  const dash = (2 * Math.PI - 0.7) * R; // visible arc (0.7 rad gap)
  const gap = 0.7 * R;
  const barX = gSize * 0.05;
  const barW = R - barX;
  const textX = W - 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#7c3aed"/>
  <g transform="translate(${gcx},${gcy})">
    <circle r="${r + T / 2}" fill="none" stroke="#ffffff" stroke-width="${T}"
            stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-0.35 * R}"/>
    <rect x="${barX}" y="${-T / 2}" width="${barW}" height="${T}" fill="#ffffff"/>
  </g>
  <text x="${textX}" y="${gcy - 10}" fill="#ffffff" font-family="Vazirmatn, Tahoma, sans-serif"
        font-size="96" font-weight="700" text-anchor="start" direction="rtl">گرامر</text>
  <text x="${textX}" y="${gcy + 70}" fill="#ffffff" font-family="Vazirmatn, Tahoma, sans-serif"
        font-size="48" font-weight="500" text-anchor="start" direction="rtl" opacity="0.9">مرور و تمرین</text>
</svg>`;
}

async function makeOgImage() {
  const file = path.join(OUT, 'og-image.png');
  const svg = ogSvg();
  const svgFile = path.join(OUT, '.og-source.svg');
  try {
    const sharp = (await import('sharp')).default;
    await sharp(Buffer.from(svg)).png().toFile(file);
    const kb = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`  ✓ og-image.png  1200x630  ${kb} KB  (sharp)`);
    return 'sharp';
  } catch (err) {
    fs.writeFileSync(svgFile, svg);
    console.warn(`  ! sharp failed (${err.message.split('\n')[0]}) — SVG kept at .og-source.svg`);
    return 'failed';
  }
}

/* ------------------------------------------------------------------ */
console.log('Generating icons…');
writePng(renderIcon(192), 'icon-192.png');
writePng(renderIcon(512), 'icon-512.png');
writePng(renderIcon(512, { maskable: true }), 'icon-maskable-512.png');
const ogTool = await makeOgImage();
if (ogTool !== 'sharp') {
  // Fallback: abstract placeholder built with pngjs (no text rendering available).
  const W = 1200, H = 630, S = 2;
  const png = new PNG({ width: W * S, height: H * S });
  for (let Y = 0; Y < H * S; Y++) {
    for (let X = 0; X < W * S; X++) {
      const x = X / S, y = Y / S;
      let c = PURPLE;
      const g = inG(x - W * 0.35 + 150, y - H / 2 + 150, 300, 1);
      const band1 = x > 700 && x < 1100 && y > 250 && y < 330;
      const band2 = x > 760 && x < 1100 && y > 370 && y < 410;
      if (g || band1 || band2) c = WHITE;
      const idx = (Y * W * S + X) << 2;
      png.data[idx] = c[0];
      png.data[idx + 1] = c[1];
      png.data[idx + 2] = c[2];
      png.data[idx + 3] = 255;
    }
  }
  const out = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) << 2;
      const i0 = ((y * 2) * W * 2 + x * 2) << 2;
      out.data[o] = png.data[i0];
      out.data[o + 1] = png.data[i0 + 1];
      out.data[o + 2] = png.data[i0 + 2];
      out.data[o + 3] = 255;
    }
  }
  fs.writeFileSync(path.join(OUT, 'og-image.png'), PNG.sync.write(out));
  console.log('  ✓ og-image.png  1200x630  (pngjs fallback, abstract)');
}
console.log('Done.');
