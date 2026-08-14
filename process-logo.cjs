const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function processLogo() {
  const sourcePath = path.join(__dirname, 'public/logo-1.png');
  const publicDir = path.join(__dirname, 'public');

  const img = await loadImage(sourcePath);

  const targets = [
    { name: 'logo.png', size: 512 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-32x32.png', size: 32 }
  ];

  for (const { name, size } of targets) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Draw image
    ctx.drawImage(img, 0, 0, size, size);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, name), buffer);
    console.log(`Saved ${name} (${size}x${size})`);
  }
}

processLogo().catch(err => console.error(err));
