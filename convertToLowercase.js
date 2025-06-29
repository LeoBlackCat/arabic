/**
 * convertToLowercase.js
 * 
 * Converts all verb names (chat fields) to lowercase across:
 * - logic.json
 * - sound files in /sounds/
 * - picture files in /pictures/ 
 * - verbs-data.js
 * 
 * IMPORTANT: Make a backup before running this!
 */

const fs = require('fs');
const path = require('path');

const logicPath = path.join(__dirname, 'logic.json');
const soundsDir = path.join(__dirname, 'sounds');
const picturesDir = path.join(__dirname, 'pictures');
const verbsDataPath = path.join(__dirname, 'src', 'verbs-data.js');

// Track changes for reporting
const changes = {
  logicJson: 0,
  soundFiles: 0,
  pictureFiles: 0,
  verbsData: 0
};

/**
 * Update logic.json chat fields to lowercase
 */
function updateLogicJson() {
  console.log('📝 Updating logic.json...');
  
  const logic = JSON.parse(fs.readFileSync(logicPath, 'utf8'));
  let changed = false;
  
  // Update items with pos="verb"
  if (logic.items) {
    logic.items.forEach(item => {
      if (item.pos === 'verb' && item.chat) {
        const original = item.chat;
        const lowercase = item.chat.toLowerCase();
        if (original !== lowercase) {
          console.log(`  • ${original} → ${lowercase}`);
          item.chat = lowercase;
          changes.logicJson++;
          changed = true;
        }
      }
    });
  }
  
  if (changed) {
    fs.writeFileSync(logicPath, JSON.stringify(logic, null, 2));
    console.log(`✅ Updated ${changes.logicJson} chat fields in logic.json`);
  } else {
    console.log('✅ All chat fields in logic.json are already lowercase');
  }
}

/**
 * Rename files in a directory to lowercase
 */
function renameFilesToLowercase(directory, fileType) {
  console.log(`\n📁 Renaming ${fileType} files...`);
  
  if (!fs.existsSync(directory)) {
    console.log(`⚠️  Directory not found: ${directory}`);
    return;
  }
  
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const lowercase = basename.toLowerCase();
    
    if (basename !== lowercase) {
      const oldPath = path.join(directory, file);
      const newPath = path.join(directory, lowercase + ext);
      
      try {
        // Check if target file already exists
        if (fs.existsSync(newPath)) {
          console.log(`⚠️  Target already exists, skipping: ${file} → ${lowercase}${ext}`);
          return;
        }
        
        fs.renameSync(oldPath, newPath);
        console.log(`  • ${file} → ${lowercase}${ext}`);
        
        if (fileType === 'sound') changes.soundFiles++;
        else if (fileType === 'picture') changes.pictureFiles++;
        
      } catch (error) {
        console.error(`❌ Error renaming ${file}:`, error.message);
      }
    }
  });
  
  const changedCount = fileType === 'sound' ? changes.soundFiles : changes.pictureFiles;
  if (changedCount > 0) {
    console.log(`✅ Renamed ${changedCount} ${fileType} files`);
  } else {
    console.log(`✅ All ${fileType} files are already lowercase`);
  }
}

/**
 * Update verbs-data.js chat fields to lowercase
 */
function updateVerbsData() {
  console.log('\n📝 Updating verbs-data.js...');
  
  if (!fs.existsSync(verbsDataPath)) {
    console.log('⚠️  verbs-data.js not found');
    return;
  }
  
  let content = fs.readFileSync(verbsDataPath, 'utf8');
  let changed = false;
  
  // Find all chat fields and convert to lowercase
  const chatRegex = /chat:\s*["']([^"']+)["']/g;
  const newContent = content.replace(chatRegex, (match, chatValue) => {
    const lowercase = chatValue.toLowerCase();
    if (chatValue !== lowercase) {
      console.log(`  • ${chatValue} → ${lowercase}`);
      changes.verbsData++;
      changed = true;
      return match.replace(chatValue, lowercase);
    }
    return match;
  });
  
  if (changed) {
    fs.writeFileSync(verbsDataPath, newContent);
    console.log(`✅ Updated ${changes.verbsData} chat fields in verbs-data.js`);
  } else {
    console.log('✅ All chat fields in verbs-data.js are already lowercase');
  }
}

/**
 * Generate summary report
 */
function generateReport() {
  console.log('\n' + '═'.repeat(50));
  console.log('📊 LOWERCASE CONVERSION SUMMARY');
  console.log('═'.repeat(50));
  
  console.log(`\n📝 Files Updated:`);
  console.log(`  • logic.json: ${changes.logicJson} chat fields`);
  console.log(`  • verbs-data.js: ${changes.verbsData} chat fields`);
  
  console.log(`\n📁 Files Renamed:`);
  console.log(`  • Sound files: ${changes.soundFiles}`);
  console.log(`  • Picture files: ${changes.pictureFiles}`);
  
  const totalChanges = changes.logicJson + changes.soundFiles + changes.pictureFiles + changes.verbsData;
  console.log(`\n🎉 Total changes: ${totalChanges}`);
  
  if (totalChanges > 0) {
    console.log('\n💡 Next steps:');
    console.log('  1. Run: npm run scan-media');
    console.log('  2. Test the application');
    console.log('  3. Commit changes if everything works');
  }
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Starting lowercase conversion...\n');
  console.log('⚠️  IMPORTANT: Make sure you have a backup before proceeding!\n');
  
  try {
    // Update logic.json
    updateLogicJson();
    
    // Rename sound files
    renameFilesToLowercase(soundsDir, 'sound');
    
    // Rename picture files  
    renameFilesToLowercase(picturesDir, 'picture');
    
    // Update verbs-data.js
    updateVerbsData();
    
    // Generate report
    generateReport();
    
    console.log('\n✨ Lowercase conversion completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during conversion:', error);
    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  updateLogicJson,
  renameFilesToLowercase,
  updateVerbsData,
  main
};

// Run if called directly
if (require.main === module) {
  main();
}