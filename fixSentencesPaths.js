const fs = require('fs');
const path = require('path');

// Fix all paths in sentences.json to be relative instead of absolute
const fixSentencesPaths = () => {
  const sentencesPath = path.join(__dirname, 'sentences.json');
  const publicSentencesPath = path.join(__dirname, 'public', 'sentences.json');

  console.log('🔧 Fixing sentence paths to be relative...');
  
  // Read the current sentences.json
  const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
  
  // Fix all paths to be relative
  sentencesData.sentences.forEach((sentence, index) => {
    console.log(`📝 Processing sentence ${index + 1}: ${sentence.id}`);
    
    // Fix audio path
    if (sentence.audioPath && sentence.audioPath.startsWith('/')) {
      sentence.audioPath = sentence.audioPath.substring(1); // Remove leading slash
      console.log(`  🎵 Fixed audio path: ${sentence.audioPath}`);
    }
    
    // Fix image paths
    if (sentence.images) {
      sentence.images = sentence.images.map(imagePath => {
        if (imagePath.startsWith('/')) {
          const fixedPath = imagePath.substring(1); // Remove leading slash
          console.log(`  🎨 Fixed image path: ${fixedPath}`);
          return fixedPath;
        }
        return imagePath;
      });
    }
  });

  // Write back to both files
  fs.writeFileSync(sentencesPath, JSON.stringify(sentencesData, null, 2));
  fs.writeFileSync(publicSentencesPath, JSON.stringify(sentencesData, null, 2));

  console.log('\n✅ Fixed all sentence paths to be relative');
  console.log('✅ Updated sentences.json');
  console.log('✅ Updated public/sentences.json');
  console.log(`📊 Processed ${sentencesData.sentences.length} sentences`);
};

// Run the script
if (require.main === module) {
  fixSentencesPaths();
}

module.exports = { fixSentencesPaths };