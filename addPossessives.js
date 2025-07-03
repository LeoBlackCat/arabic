const fs = require('fs');
const logicData = require('./logic.json');

// Emirati Arabic possessive suffixes
const possessiveSuffixes = {
  my: { m: 'ي', f: 'تي' },
  your_m: { m: 'ك', f: 'تك' },
  your_f: { m: 'ج', f: 'تج' }, // Note: using 'ج' not 'ش' for Emirati
  your_pl: { m: 'كم', f: 'تكم' },
  our: { m: 'نا', f: 'تنا' },
  his: { m: 'ه', f: 'ته' },
  her: { m: 'ها', f: 'تها' },
  their: { m: 'هم', f: 'تهم' }
};

// Chat versions of possessive suffixes
const possessiveChatSuffixes = {
  my: { m: 'y', f: 'ty' },
  your_m: { m: 'ik', f: 'tik' }, // Emirati: -ik not -ak
  your_f: { m: 'ich', f: 'tich' }, // Emirati: -ich not -ech
  your_pl: { m: 'kum', f: 'tkum' },
  our: { m: 'na', f: 'tna' },
  his: { m: 'ah', f: 'tah' },
  her: { m: 'aha', f: 'taha' },
  their: { m: 'ahum', f: 'tahum' }
};

// Function to add possessive forms to a noun
function addPossessivesToNoun(noun) {
  if (!noun.ar || !noun.chat) {
    console.log(`⚠️  Skipping ${noun.eng} - missing Arabic or chat`);
    return noun;
  }

  // Determine gender - default to masculine if not specified
  const gender = noun.gender || 'm';
  const isFeminine = gender === 'f';
  
  console.log(`Processing: ${noun.chat} (${noun.eng}) - Gender: ${gender}`);
  
  let arabicRoot = noun.ar;
  let chatRoot = noun.chat;
  
  // For feminine nouns ending in 'ة' (ah), remove it and add 'ت' (t) before suffixes
  if (isFeminine && arabicRoot.endsWith('ة')) {
    arabicRoot = arabicRoot.slice(0, -1) + 'ت';
    console.log(`  Feminine transformation: ${noun.ar} -> ${arabicRoot} + suffix`);
  }
  
  // For feminine chat ending in 'ah', replace with 't'
  if (isFeminine && chatRoot.endsWith('ah')) {
    chatRoot = chatRoot.slice(0, -2) + 't';
    console.log(`  Chat transformation: ${noun.chat} -> ${chatRoot} + suffix`);
  }
  
  // Add possessive forms
  Object.keys(possessiveSuffixes).forEach(possessiveType => {
    const arabicSuffix = possessiveSuffixes[possessiveType][isFeminine ? 'f' : 'm'];
    const chatSuffix = possessiveChatSuffixes[possessiveType][isFeminine ? 'f' : 'm'];
    
    noun[possessiveType] = arabicRoot + arabicSuffix;
    noun[`${possessiveType}_chat`] = chatRoot + chatSuffix;
  });
  
  return noun;
}

// Find all nouns that need possessive forms
const nounsNeedingPossessives = logicData.items.filter(item => {
  if (item.pos !== 'noun') return false;
  
  const hasPossessives = item.my && item.your_m && item.your_f && item.your_pl && 
                        item.our && item.his && item.her && item.their;
  return !hasPossessives;
});

console.log(`Found ${nounsNeedingPossessives.length} nouns needing possessive forms:\n`);

// Add possessives to each noun
nounsNeedingPossessives.forEach((noun, index) => {
  console.log(`[${index + 1}/${nounsNeedingPossessives.length}] ${noun.chat} (${noun.eng})`);
  
  // Determine gender based on English word or existing gender field
  if (!noun.gender) {
    // Auto-detect gender based on common patterns
    const eng = noun.eng.toLowerCase();
    if (eng.includes('woman') || eng.includes('wife') || eng.includes('sister') || 
        eng.includes('daughter') || eng.includes('girl') || eng.includes('mother')) {
      noun.gender = 'f';
    } else if (eng.includes('man') || eng.includes('husband') || eng.includes('brother') || 
               eng.includes('son') || eng.includes('boy') || eng.includes('father')) {
      noun.gender = 'm';
    } else {
      // For non-human nouns, check if Arabic ends with ة
      if (noun.ar && noun.ar.endsWith('ة')) {
        noun.gender = 'f';
      } else {
        noun.gender = 'm'; // Default to masculine
      }
    }
    console.log(`  Auto-detected gender: ${noun.gender}`);
  }
  
  addPossessivesToNoun(noun);
  console.log(`  ✅ Added possessives\n`);
});

// Save the updated logic.json
fs.writeFileSync('./logic.json', JSON.stringify(logicData, null, 2));

console.log(`🎉 Successfully added possessive forms to ${nounsNeedingPossessives.length} nouns!`);
console.log('📁 Updated logic.json saved');

// Show summary
console.log('\n📊 Summary of added possessives:');
nounsNeedingPossessives.forEach(noun => {
  console.log(`${noun.chat}: my=${noun.my} (${noun.my_chat}), your_m=${noun.your_m} (${noun.your_m_chat}), your_f=${noun.your_f} (${noun.your_f_chat})`);
});