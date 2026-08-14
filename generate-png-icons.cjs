const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawTaskSlayerIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const r = size;
  const scale = size / 512;

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, r, r);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#1e1b4b');
  bgGrad.addColorStop(1, '#311042');

  const rx = 112 * scale;
  ctx.beginPath();
  ctx.roundRect(0, 0, r, r, rx);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // 2. Shield Fill Gradient
  const shieldGrad = ctx.createLinearGradient(112 * scale, 80 * scale, 400 * scale, 425 * scale);
  shieldGrad.addColorStop(0, '#312e81');
  shieldGrad.addColorStop(0.5, '#1e1b4b');
  shieldGrad.addColorStop(1, '#0f172a');

  // Shield Path
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(256 * scale, 80 * scale);
  ctx.bezierCurveTo(330 * scale, 80 * scale, 400 * scale, 98 * scale, 400 * scale, 98 * scale);
  ctx.lineTo(400 * scale, 240 * scale);
  ctx.bezierCurveTo(400 * scale, 345 * scale, 256 * scale, 425 * scale, 256 * scale, 425 * scale);
  ctx.bezierCurveTo(256 * scale, 425 * scale, 112 * scale, 345 * scale, 112 * scale, 240 * scale);
  ctx.lineTo(112 * scale, 98 * scale);
  ctx.bezierCurveTo(112 * scale, 98 * scale, 182 * scale, 80 * scale, 256 * scale, 80 * scale);
  ctx.closePath();

  ctx.fillStyle = shieldGrad;
  ctx.fill();

  // Shield Border
  const borderGrad = ctx.createLinearGradient(112 * scale, 80 * scale, 400 * scale, 425 * scale);
  borderGrad.addColorStop(0, '#818cf8');
  borderGrad.addColorStop(0.5, '#6366f1');
  borderGrad.addColorStop(1, '#a855f7');
  ctx.lineWidth = 12 * scale;
  ctx.strokeStyle = borderGrad;
  ctx.stroke();

  // Shield Inner Border Line
  ctx.beginPath();
  ctx.moveTo(256 * scale, 100 * scale);
  ctx.bezierCurveTo(315 * scale, 100 * scale, 380 * scale, 114 * scale, 380 * scale, 114 * scale);
  ctx.lineTo(380 * scale, 235 * scale);
  ctx.bezierCurveTo(380 * scale, 325 * scale, 256 * scale, 398 * scale, 256 * scale, 398 * scale);
  ctx.bezierCurveTo(256 * scale, 398 * scale, 132 * scale, 325 * scale, 132 * scale, 235 * scale);
  ctx.lineTo(132 * scale, 114 * scale);
  ctx.bezierCurveTo(132 * scale, 114 * scale, 197 * scale, 100 * scale, 256 * scale, 100 * scale);
  ctx.lineWidth = 4 * scale;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();

  // Checkmark Emblem inside Shield
  ctx.beginPath();
  ctx.moveTo(205 * scale, 240 * scale);
  ctx.lineTo(242 * scale, 277 * scale);
  ctx.lineTo(312 * scale, 185 * scale);
  ctx.lineWidth = 24 * scale;
  ctx.strokeStyle = '#818cf8';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  // 3. Dark Cut Gap Line through Shield
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(80 * scale, 400 * scale);
  ctx.lineTo(432 * scale, 112 * scale);
  ctx.lineWidth = 16 * scale;
  ctx.strokeStyle = '#090d16';
  ctx.lineCap = 'round';
  ctx.stroke();

  // 4. Glowing Cyan Sword Slash (Wide Glow)
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 18 * scale;
  ctx.beginPath();
  ctx.moveTo(60 * scale, 415 * scale);
  ctx.lineTo(452 * scale, 97 * scale);
  ctx.lineWidth = 24 * scale;
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.85)';
  ctx.lineCap = 'round';
  ctx.stroke();

  // 5. Sword Slash Core (Bright White Beam)
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10 * scale;
  ctx.beginPath();
  ctx.moveTo(70 * scale, 408 * scale);
  ctx.lineTo(442 * scale, 104 * scale);
  ctx.lineWidth = 10 * scale;
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Thin White Line
  ctx.beginPath();
  ctx.moveTo(90 * scale, 392 * scale);
  ctx.lineTo(422 * scale, 120 * scale);
  ctx.lineWidth = 4 * scale;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();

  // 6. Impact Flash Center
  ctx.save();
  ctx.beginPath();
  ctx.arc(256 * scale, 256 * scale, 32 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(103, 232, 249, 0.4)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(256 * scale, 256 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // 7. Energy Particles & Floating Cubes along the Slash
  function drawParticle(x, y, w, h, angleDeg, color) {
    ctx.save();
    ctx.translate(x * scale, y * scale);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect((-w / 2) * scale, (-h / 2) * scale, w * scale, h * scale, 2 * scale);
    ctx.fill();
    ctx.restore();
  }

  drawParticle(310, 190, 14, 14, 25, '#38bdf8');
  drawParticle(345, 155, 16, 16, 45, '#67e8f9');
  drawParticle(375, 125, 10, 10, 15, '#a5f3fc');
  drawParticle(180, 290, 14, 14, 30, '#38bdf8');
  drawParticle(150, 320, 10, 10, 60, '#67e8f9');

  // Sparkle Dots
  function drawDot(cx, cy, r, color) {
    ctx.beginPath();
    ctx.arc(cx * scale, cy * scale, r * scale, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  drawDot(330, 170, 4, '#ffffff');
  drawDot(360, 140, 3, '#a5f3fc');
  drawDot(390, 115, 5, '#38bdf8');
  drawDot(280, 220, 4, '#ffffff');
  drawDot(220, 285, 3, '#67e8f9');
  drawDot(170, 335, 5, '#a5f3fc');
  drawDot(130, 370, 3, '#38bdf8');

  return canvas.toBuffer('image/png');
}

// Generate icons
const publicDir = path.join(__dirname, 'public');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 }
];

sizes.forEach(({ name, size }) => {
  const buffer = drawTaskSlayerIcon(size);
  fs.writeFileSync(path.join(publicDir, name), buffer);
  console.log(`Generated ${name} (${size}x${size})`);
});
