const sharp = require('sharp');
const fs = require('fs');

// We will modify the SVG to have no border radius because iOS applies its own.
let svg = fs.readFileSync('src/app/icon.svg', 'utf8');
svg = svg.replace('rx="28"', 'rx="0"');
svg = svg.replace('viewBox="0 0 128 128"', 'viewBox="0 0 128 128" width="180" height="180"');

sharp(Buffer.from(svg))
  .resize(180, 180)
  .png()
  .toFile('src/app/apple-icon.png')
  .then(() => console.log('apple-icon.png generated!'))
  .catch(err => console.error(err));
