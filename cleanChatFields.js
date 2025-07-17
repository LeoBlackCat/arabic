const fs = require('fs');
const path = require('path');

function cleanChatFields() {
  console.log('🧹 Cleaning chat fields in sentences.json...');
  
  const sentencesPath = path.join(__dirname, 'sentences.json');
  if (!fs.existsSync(sentencesPath)) {
    console.error('❌ sentences.json not found');
    return;
  }
  
  const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
  let cleanedCount = 0;
  
  const cleanedSentences = sentencesData.sentences.map(sentence => {
    let originalChat = sentence.chat;
    let cleanedChat = originalChat;
    
    // Remove quotes at the beginning and end
    cleanedChat = cleanedChat.replace(/^"/, '').replace(/"$/, '');
    
    // Remove English translation in parentheses at the end
    cleanedChat = cleanedChat.replace(/\s*\([^)]*\)\s*$/, '');
    
    // Remove any remaining quotes
    cleanedChat = cleanedChat.replace(/"/g, '');
    
    // Trim whitespace
    cleanedChat = cleanedChat.trim();
    
    if (originalChat !== cleanedChat) {
      console.log(`✅ Cleaned sentence ${sentence.id}:`);
      console.log(`   Before: ${originalChat}`);
      console.log(`   After:  ${cleanedChat}`);
      cleanedCount++;
    }
    
    return {
      ...sentence,
      chat: cleanedChat
    };
  });
  
  // Update the data
  const updatedData = {
    sentences: cleanedSentences,
    lastUpdated: new Date().toISOString()
  };
  
  // Save updated sentences.json
  fs.writeFileSync(sentencesPath, JSON.stringify(updatedData, null, 2));
  console.log(`\n✅ Updated sentences.json`);
  
  // Also update the dist version
  const distSentencesPath = path.join(__dirname, 'dist', 'sentences.json');
  if (fs.existsSync(distSentencesPath)) {
    fs.writeFileSync(distSentencesPath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Updated dist/sentences.json');
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   • Total sentences: ${cleanedSentences.length}`);
  console.log(`   • Sentences cleaned: ${cleanedCount}`);
  console.log(`   • Sentences unchanged: ${cleanedSentences.length - cleanedCount}`);
  
  if (cleanedCount === 0) {
    console.log('🎉 All chat fields were already clean!');
  } else {
    console.log('🎉 Chat fields successfully cleaned!');
  }
}

// Run the script
if (require.main === module) {
  cleanChatFields();
}

module.exports = { cleanChatFields };