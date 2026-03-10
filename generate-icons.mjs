// OPP Icon Generator
// Run once: node generate-icons.mjs
// Requires: npm install sharp

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const svg = readFileSync('./opp-icon.svg');
const outDir = './public/icons';
mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'icon-192.png',        size: 192 },
  { name: 'icon-512.png',        size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png',      size: 32  },
  { name: 'favicon-16.png',      size: 16  },
];

for (const { name, size } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(outDir, name));
  console.log(`✓ ${name} (${size}x${size})`);
}

console.log('\nAll icons generated in public/icons/');
console.log('Copy manifest.webmanifest to public/');
