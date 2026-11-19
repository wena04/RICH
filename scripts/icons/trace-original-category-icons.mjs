// Converts the original Rich 1.1.0 category rasters into vector glyphs.
//
// Each original PNG is a 48pt (144px) or 34pt (102px, icon_huankuan) canvas with the glyph
// composited over an opaque #F7F7F7 disc. This script:
//   1. removes the disc exactly (colour-to-alpha against #F7F7F7), so the disc can be drawn in code;
//   2. splits the glyph into its two inks — black and the #02B17B accent — extending the black layer
//      a few pixels under touching accent pixels so the accent drawn on top meets it without a seam;
//   3. upscales each layer 4x and traces it with potrace at the 50% alpha edge;
//   4. writes one SVG per icon on a 48-unit viewBox to assets/icons/categories/.
//
// Usage: node scripts/icons/trace-original-category-icons.mjs <dir-of-original-3x-pngs>
// The rasters come from the original app bundle's Assets.car (see extract-assets-car.swift); they are
// kept off-repo with the rest of the private reference bundle.
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Jimp from 'jimp';
import potrace from 'potrace';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = process.argv[2];
if (!sourceDir) throw new Error('Pass the directory that holds the original icon_*.png rasters.');
const outDir = path.join(repoRoot, 'assets/icons/categories');

const DISC = [247, 247, 247];
const INK = '#000000';
const ACCENT = '#02B17B';
const UPSCALE = 4;
const JOIN_RADIUS = 3;
// UI artwork that lives next to the category rasters in the original catalog but is not a disc icon.
const SKIP = new Set(['icon_setting', 'icon_three_dot']);
const TRACE = { threshold: 128, turdSize: 8, alphaMax: 1, optCurve: true, optTolerance: 0.2, turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY };

function layers(image) {
  const { width: W, height: H, data } = image.bitmap;
  const ink = new Float32Array(W * H);
  const accent = new Float32Array(W * H);
  for (let k = 0; k < W * H; k++) {
    const C = [data[k * 4], data[k * 4 + 1], data[k * 4 + 2]];
    if (data[k * 4 + 3] < 250) continue; // disc rim and outside: no glyph there
    let a = 0;
    for (let j = 0; j < 3; j++) a = Math.max(a, C[j] < DISC[j] ? (DISC[j] - C[j]) / DISC[j] : (C[j] - DISC[j]) / (255 - DISC[j]));
    if (a < 0.004) continue;
    const F = C.map((v, j) => Math.max(0, Math.min(255, (v - (1 - a) * DISC[j]) / a)));
    const green = Math.max(0, Math.min(1, (F[1] - F[0]) / 150));
    ink[k] = a * (1 - green);
    accent[k] = a * green;
  }
  const inkJoined = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let nearest = 0;
      for (let dy = -JOIN_RADIUS; dy <= JOIN_RADIUS; dy++) {
        for (let dx = -JOIN_RADIUS; dx <= JOIN_RADIUS; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < H) nearest = Math.max(nearest, ink[yy * W + xx]);
        }
      }
      const k = y * W + x;
      inkJoined[k] = Math.max(ink[k], Math.min(ink[k] + accent[k], nearest));
    }
  }
  return { W, H, ink: inkJoined, accent };
}

// Bilinear upscale sampled at pixel centres (Jimp's resize shifts edges by about half a pixel),
// drawn as a black shape on white for potrace.
function maskImage(values, W, H) {
  const OW = W * UPSCALE;
  const OH = H * UPSCALE;
  const at = (x, y) => values[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  const mask = new Jimp(OW, OH, 0xffffffff);
  for (let Y = 0; Y < OH; Y++) {
    const v = (Y + 0.5) / UPSCALE - 0.5;
    const y0 = Math.floor(v);
    const fy = v - y0;
    for (let X = 0; X < OW; X++) {
      const u = (X + 0.5) / UPSCALE - 0.5;
      const x0 = Math.floor(u);
      const fx = u - x0;
      const a =
        at(x0, y0) * (1 - fx) * (1 - fy) +
        at(x0 + 1, y0) * fx * (1 - fy) +
        at(x0, y0 + 1) * (1 - fx) * fy +
        at(x0 + 1, y0 + 1) * fx * fy;
      const g = Math.round(255 * (1 - a));
      mask.bitmap.data.set([g, g, g, 255], (Y * OW + X) * 4);
    }
  }
  return mask;
}

function trace(mask) {
  return new Promise((resolve, reject) => {
    const tracer = new potrace.Potrace();
    tracer.setParameters(TRACE);
    tracer.loadImage(mask, (error) => (error ? reject(error) : resolve(tracer.getPathTag().match(/ d="([^"]*)"/)?.[1] ?? '')));
  });
}

// potrace works in upscaled pixels; rewrite every coordinate onto the 48-unit viewBox.
function toViewBox(d, scale) {
  return d
    .replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(Number(n) * scale * 100) / 100))
    .replace(/\s+/g, ' ')
    .replace(/ ?, ?/g, ',')
    .replace(/ ?([MCLZ]) ?/g, '$1')
    .trim();
}

const names = readdirSync(sourceDir)
  .map((file) => file.match(/^(icon_[a-z0-9]+)(@3x)?\.png$/)?.[1])
  .filter((name) => name && !SKIP.has(name))
  .sort();

for (const name of names) {
  const file = readdirSync(sourceDir).find((f) => f === `${name}.png` || f === `${name}@3x.png`);
  const image = await Jimp.read(path.join(sourceDir, file));
  const { W, H, ink, accent } = layers(image);
  const scale = 48 / (W * UPSCALE);
  const paths = [];
  const inkPath = await trace(maskImage(ink, W, H));
  if (inkPath) paths.push(`<path fill="${INK}" fill-rule="evenodd" d="${toViewBox(inkPath, scale)}"/>`);
  if (accent.some((v) => v > 0.5)) {
    const accentPath = await trace(maskImage(accent, W, H));
    if (accentPath) paths.push(`<path fill="${ACCENT}" fill-rule="evenodd" d="${toViewBox(accentPath, scale)}"/>`);
  }
  writeFileSync(path.join(outDir, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${paths.join('')}</svg>\n`);
}
console.log(`traced ${names.length} icons into ${path.relative(repoRoot, outDir)}`);
