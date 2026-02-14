const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = Buffer.from(`
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <!-- Background gradient -->
    <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#F39C12;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <!-- Rounded rectangle background -->
    <rect width="1024" height="1024" rx="180" fill="url(#bgGradient)"/>
    
    <!-- Airplane icon -->
    <g transform="translate(512, 512)">
        <!-- Airplane body -->
        <path d="M 0,-200 L 50,-100 L 200,-50 L 200,0 L 100,50 L 100,100 L 50,150 L 0,100 L -50,150 L -100,100 L -100,50 L -200,0 L -200,-50 L -50,-100 Z" 
              fill="white" opacity="0.95"/>
        <!-- Airplane tail -->
        <circle cx="0" cy="-180" r="30" fill="white" opacity="0.95"/>
    </g>
</svg>
`);

// Create assets directory if not exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
}

// Generate icon.png (1024x1024)
sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'))
    .then(info => { console.log('Icon generated successfully:', info); })
    .catch(err => { console.error('Error generating icon:', err); });
