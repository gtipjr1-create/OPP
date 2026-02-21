async function main() {
  const { createCanvas } = await import('canvas');
  const fs = await import('node:fs');
  const path = await import('node:path');

  const APP_SHORT_NAME = 'OPP';

  function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    const glow = ctx.createRadialGradient(size / 2, size / 2 + size * 0.05, 0, size / 2, size / 2, size * 0.55);
    glow.addColorStop(0, 'rgba(59,130,246,0.45)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    const fontSize = Math.round(size * 0.38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + fontSize + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(APP_SHORT_NAME, size / 2, size / 2);

    return canvas.toBuffer('image/png');
  }

  const dir = path.join(process.cwd(), 'public');
  fs.writeFileSync(path.join(dir, 'icon-192.png'), drawIcon(192));
  fs.writeFileSync(path.join(dir, 'icon-512.png'), drawIcon(512));
  console.log('Icons written: icon-192.png, icon-512.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});