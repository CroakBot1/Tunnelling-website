const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const baseImagePath = './logo.png';
const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
    const image = await loadImage(baseImagePath);

    for (const size of sizes) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        const scale = Math.min(size / image.width, size / image.height);
        const x = (size - image.width * scale) / 2;
        const y = (size - image.height * scale) / 2;
        ctx.drawImage(image, x, y, image.width * scale, image.height * scale);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`icon-${size}.png`, buffer);
        console.log(`Generated icon-${size}.png`);
    }
}

generateIcons().catch(console.error);
