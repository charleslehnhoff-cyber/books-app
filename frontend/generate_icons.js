const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#0f172a"/>
  <defs>
    <linearGradient id="gradient" x1="128" y1="160" x2="384" y2="416" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0ea5e9"/>
      <stop offset="1" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <path d="M256 128c-32-32-80-32-128-32v288c48 0 96 16 128 48 32-32 80-48 128-48V96c-48 0-96 0-128 32z" fill="none" stroke="#fff" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

async function generate() {
  try {
    const buf = Buffer.from(svgIcon);
    await sharp(buf).resize(192, 192).png().toFile(path.join(__dirname, 'public', 'icon-192x192.png'));
    await sharp(buf).resize(512, 512).png().toFile(path.join(__dirname, 'public', 'icon-512x512.png'));
    console.log('Icons generated successfully.');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
