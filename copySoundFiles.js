const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, 'sounds');
const files = fs.readdirSync(soundsDir);

let copied = 0;

// Find uppercase files and copy to lowercase if lowercase doesn't exist
files.forEach(file => {
  if (file.match(/^[A-Z][A-Za-z0-9']*\.wav$/) && !file.includes(' ')) {
    const lowercase = file.toLowerCase();
    const uppercasePath = path.join(soundsDir, file);
    const lowercasePath = path.join(soundsDir, lowercase);
    
    if (!fs.existsSync(lowercasePath)) {
      fs.copyFileSync(uppercasePath, lowercasePath);
      console.log(`Copied: ${file} → ${lowercase}`);
      copied++;
    } else {
      console.log(`Exists: ${lowercase} (skipping ${file})`);
    }
  }
});

console.log(`\nCopied ${copied} files to lowercase versions`);