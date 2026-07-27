
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#6C63FF"/>
  <text x="256" y="330" font-size="280" text-anchor="middle">📅</text>
</svg>`;

const buf = Buffer.from(svg);
await sharp(buf).resize(192,192).png().toFile('public/icon-192.png');
await sharp(buf).resize(512,512).png().toFile('public/icon-512.png');
console.log('Icônes générées !');