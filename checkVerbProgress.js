const fs = require('fs');
const path = require('path');

// Function to get all verbs from logic.json
function getVerbsFromLogic() {
  const logicPath = path.join(__dirname, 'logic.json');
  const logicData = JSON.parse(fs.readFileSync(logicPath, 'utf8'));
  
  // Filter items that are verbs (looking for "i " prefix in English)
  const verbs = logicData.items.filter(item => 
    item.eng && item.eng.toLowerCase().startsWith('i ')
  );
  
  return verbs;
}

// Function to analyze current progress
function analyzeProgress() {
  console.log('📊 VERB SENTENCE PROGRESS ANALYSIS');
  console.log('═══════════════════════════════════════');
  
  const allVerbs = getVerbsFromLogic();
  console.log(`🔍 Total verbs in logic.json: ${allVerbs.length}`);
  
  // Get existing sentences
  const sentencesPath = path.join(__dirname, 'sentences.json');
  let existingSentences = [];
  if (fs.existsSync(sentencesPath)) {
    const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
    existingSentences = sentencesData.sentences || [];
  }
  
  console.log(`📝 Current sentences: ${existingSentences.length}`);
  
  // Find covered verbs
  const coveredVerbs = new Set();
  const verbSentenceMap = new Map();
  
  existingSentences.forEach(sentence => {
    allVerbs.forEach(verb => {
      if (sentence.chat.includes(verb.chat)) {
        coveredVerbs.add(verb.chat);
        verbSentenceMap.set(verb.chat, sentence);
      }
    });
  });
  
  const uncoveredVerbs = allVerbs.filter(verb => !coveredVerbs.has(verb.chat));
  
  console.log(`✅ Verbs with sentences: ${coveredVerbs.size}`);
  console.log(`❌ Verbs needing sentences: ${uncoveredVerbs.length}`);
  
  // Show progress percentage
  const progressPercentage = ((coveredVerbs.size / allVerbs.length) * 100).toFixed(1);
  console.log(`📈 Progress: ${progressPercentage}% complete`);
  
  console.log('\n🎯 COVERED VERBS:');
  Array.from(coveredVerbs).forEach((verb, index) => {
    const verbData = allVerbs.find(v => v.chat === verb);
    if (verbData) {
      console.log(`   ${index + 1}. ${verb} (${verbData.eng})`);
    }
  });
  
  console.log('\n⏳ VERBS STILL NEEDING SENTENCES:');
  uncoveredVerbs.forEach((verb, index) => {
    console.log(`   ${index + 1}. ${verb.chat} (${verb.eng}) - ${verb.ar}`);
  });
  
  if (uncoveredVerbs.length > 0) {
    console.log(`\n💡 Next verb to process: ${uncoveredVerbs[0].chat} (${uncoveredVerbs[0].eng})`);
    console.log(`💰 Cost estimate: ~$0.50-1.00 per verb (OpenAI + ElevenLabs)`);
    console.log(`📊 Total remaining cost: ~$${(uncoveredVerbs.length * 0.75).toFixed(2)}`);
  } else {
    console.log('\n🎉 All verbs are covered!');
  }
  
  return {
    totalVerbs: allVerbs.length,
    coveredVerbs: coveredVerbs.size,
    uncoveredVerbs: uncoveredVerbs.length,
    nextVerb: uncoveredVerbs[0] || null
  };
}

// Run the analysis
if (require.main === module) {
  analyzeProgress();
}

module.exports = { analyzeProgress };