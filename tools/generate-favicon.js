import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateFavicons() {
    const inputFile = join(__dirname, '../growth logo.png');
    const publicDir = join(__dirname, '../public');

    // Ensure public directory exists
    await fs.mkdir(publicDir, { recursive: true });

    const sizes = {
        'favicon-16x16.png': 16,
        'favicon-32x32.png': 32,
        'apple-touch-icon.png': 180,
        'android-chrome-192x192.png': 192,
        'android-chrome-512x512.png': 512
    };

    // Generate each size
    for (const [filename, size] of Object.entries(sizes)) {
        await sharp(inputFile)
            .resize(size, size)
            .toFile(join(publicDir, filename));
        console.log(`Generated ${filename}`);
    }

    // Generate ICO file (16x16 and 32x32)
    const ico16 = await sharp(inputFile)
        .resize(16, 16)
        .toBuffer();
    
    await sharp(ico16)
        .toFile(join(publicDir, 'favicon.ico'));
    
    console.log('Generated favicon.ico');
}

generateFavicons().catch(console.error); 