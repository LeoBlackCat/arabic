/**
 * cleanupSoundFiles.js
 * 
 * Removes uppercase sound files when lowercase versions already exist
 * This cleans up the duplicate files created during the conversion process
 */

const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, 'sounds');

function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate sound files...\n');
  
  if (!fs.existsSync(soundsDir)) {
    console.error('❌ Sounds directory not found');
    return;
  }
  
  const files = fs.readdirSync(soundsDir);
  let removed = 0;
  let kept = 0;
  
  // Find uppercase files
  const uppercaseFiles = files.filter(file => 
    file.match(/^[A-Z].*\.wav$/) && !file.includes(' ')
  );
  
  console.log(`Found ${uppercaseFiles.length} uppercase sound files to check\n`);
  
  uppercaseFiles.forEach(uppercaseFile => {
    const lowercaseFile = uppercaseFile.toLowerCase();
    const uppercasePath = path.join(soundsDir, uppercaseFile);
    const lowercasePath = path.join(soundsDir, lowercaseFile);
    
    if (fs.existsSync(lowercasePath)) {
      // Both files exist, remove the uppercase one
      try {
        fs.unlinkSync(uppercasePath);
        console.log(`🗑️  Removed: ${uppercaseFile} (keeping ${lowercaseFile})`);
        removed++;
      } catch (error) {
        console.error(`❌ Error removing ${uppercaseFile}:`, error.message);
      }
    } else {
      // Only uppercase exists, rename it to lowercase
      try {
        fs.renameSync(uppercasePath, lowercasePath);
        console.log(`📝 Renamed: ${uppercaseFile} → ${lowercaseFile}`);
        kept++;
      } catch (error) {
        console.error(`❌ Error renaming ${uppercaseFile}:`, error.message);
      }
    }
  });
  
  console.log(`\n📊 CLEANUP SUMMARY:`);
  console.log(`  • Removed duplicates: ${removed}`);
  console.log(`  • Renamed to lowercase: ${kept}`);
  console.log(`  • Total processed: ${removed + kept}`);
  
  // Show remaining uppercase files (if any)
  const remainingFiles = fs.readdirSync(soundsDir);
  const remainingUppercase = remainingFiles.filter(file => 
    file.match(/^[A-Z]/) && file.endsWith('.wav')
  );
  
  if (remainingUppercase.length > 0) {
    console.log(`\n⚠️  Remaining uppercase files (probably have spaces in names):`);
    remainingUppercase.forEach(file => console.log(`    • ${file}`));
  } else {
    console.log(`\n✅ All sound files are now lowercase!`);
  }
}

function main() {
  try {
    cleanupDuplicates();
    console.log('\n✨ Sound file cleanup completed!');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { cleanupDuplicates };