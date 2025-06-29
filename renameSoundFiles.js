/**
 * renameSoundFiles.js
 * 
 * Properly renames uppercase sound files to lowercase
 * If lowercase version exists, keeps the existing one and removes uppercase
 * If no lowercase version exists, renames uppercase to lowercase
 */

const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, 'sounds');

function renameSoundFiles() {
  console.log('📝 Renaming sound files to lowercase...\n');
  
  if (!fs.existsSync(soundsDir)) {
    console.error('❌ Sounds directory not found');
    return;
  }
  
  const files = fs.readdirSync(soundsDir);
  let renamed = 0;
  let removed = 0;
  let skipped = 0;
  
  // Find uppercase files (excluding files with spaces)
  const uppercaseFiles = files.filter(file => 
    file.match(/^[A-Z][A-Za-z0-9']*\.wav$/) // Only simple uppercase files, no spaces
  );
  
  console.log(`Found ${uppercaseFiles.length} uppercase sound files to process\n`);
  
  uppercaseFiles.forEach(uppercaseFile => {
    const lowercaseFile = uppercaseFile.toLowerCase();
    const uppercasePath = path.join(soundsDir, uppercaseFile);
    const lowercasePath = path.join(soundsDir, lowercaseFile);
    
    if (fs.existsSync(lowercasePath)) {
      // Both files exist - check if they're identical
      try {
        const uppercaseStats = fs.statSync(uppercasePath);
        const lowercaseStats = fs.statSync(lowercasePath);
        
        if (uppercaseStats.size === lowercaseStats.size) {
          // Likely duplicates, remove uppercase
          fs.unlinkSync(uppercasePath);
          console.log(`🗑️  Removed duplicate: ${uppercaseFile} (keeping ${lowercaseFile})`);
          removed++;
        } else {
          // Different files, keep both but warn
          console.log(`⚠️  Kept both: ${uppercaseFile} & ${lowercaseFile} (different sizes)`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${uppercaseFile}:`, error.message);
        skipped++;
      }
    } else {
      // Only uppercase exists, rename it to lowercase
      try {
        fs.renameSync(uppercasePath, lowercasePath);
        console.log(`✅ Renamed: ${uppercaseFile} → ${lowercaseFile}`);
        renamed++;
      } catch (error) {
        console.error(`❌ Error renaming ${uppercaseFile}:`, error.message);
        skipped++;
      }
    }
  });
  
  console.log(`\n📊 RENAME SUMMARY:`);
  console.log(`  • Files renamed: ${renamed}`);
  console.log(`  • Duplicates removed: ${removed}`);
  console.log(`  • Files skipped: ${skipped}`);
  console.log(`  • Total processed: ${renamed + removed + skipped}`);
  
  // Show remaining uppercase files
  const remainingFiles = fs.readdirSync(soundsDir);
  const remainingUppercase = remainingFiles.filter(file => 
    file.match(/^[A-Z]/) && file.endsWith('.wav')
  );
  
  if (remainingUppercase.length > 0) {
    console.log(`\n📋 Remaining uppercase files (likely have spaces):`);
    remainingUppercase.forEach(file => console.log(`    • ${file}`));
    console.log(`\nThese files were skipped because they contain spaces or special characters.`);
  } else {
    console.log(`\n🎉 All simple uppercase files have been processed!`);
  }
}

function main() {
  try {
    renameSoundFiles();
    console.log('\n✨ Sound file renaming completed!');
  } catch (error) {
    console.error('\n❌ Error during renaming:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { renameSoundFiles };