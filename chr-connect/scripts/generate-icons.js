/**
 * Generates PWA icons (192x192 and 512x512) using Canvas.
 * Run: node scripts/generate-icons.js
 *
 * No dependencies needed — uses built-in node:canvas polyfill approach.
 * Falls back to creating simple SVG-based icons if canvas isn't available.
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

function createSVG(size) {
  const fontSize = Math.round(size * 0.28);
  const subFontSize = Math.round(size * 0.10);
  const radius = Math.round(size * 0.18);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <text x="50%" y="42%" text-anchor="middle" dominant-baseline="middle" fill="url(#accent)" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${fontSize}">CHR</text>
  <text x="50%" y="68%" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="${subFontSize}">CONNECT</text>
</svg>`;
}

// Try to use sharp if available, otherwise create SVG files
try {
  // Attempt to use sharp for PNG generation
  const sharp = require('sharp');

  async function generatePNG(size, filename) {
    const svg = createSVG(size);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, filename));
    console.log(`  ✓ ${filename} (${size}x${size})`);
  }

  (async () => {
    console.log('Generating PWA icons with sharp...');
    await generatePNG(192, 'icon-192.png');
    await generatePNG(512, 'icon-512.png');
    // Apple touch icon
    await generatePNG(180, 'apple-touch-icon.png');
    console.log('Done!');
  })();
} catch {
  // sharp not available — write SVG files and create a minimal PNG using the SVG
  console.log('sharp not found. Generating SVG icons (convert to PNG for full PWA support)...');

  [192, 512, 180].forEach((size) => {
    const svg = createSVG(size);
    const name = size === 180 ? 'apple-touch-icon' : `icon-${size}`;
    fs.writeFileSync(path.join(ICONS_DIR, `${name}.svg`), svg);
    console.log(`  ✓ ${name}.svg (${size}x${size})`);
  });

  console.log('\nTo convert to PNG, install sharp and re-run:');
  console.log('  npm install sharp --save-dev && node scripts/generate-icons.js');
}
