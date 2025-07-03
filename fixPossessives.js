const fs = require('fs');
const logicData = require('./logic.json');

// Fix the feminine possessive forms that have double letters
const nounsToFix = [
  { id: 148, chat: 'shorbah', correctChatRoot: 'shorbt' },
  { id: 154, chat: '7alawah', correctChatRoot: '7alawt' },
  { id: 155, chat: 'khedhrah', correctChatRoot: 'khedhrt' },
  { id: 156, chat: 'shantah', correctChatRoot: 'shantt' },
  { id: 157, chat: 'taawlah', correctChatRoot: 'taawlt' },
  { id: 161, chat: 'ekht', correctChatRoot: 'ekht' }, // This one doesn't need 't' transformation
  { id: 164, chat: 'zoojah', correctChatRoot: 'zoojt' }
];

// Chat versions of possessive suffixes (Emirati)
const possessiveChatSuffixes = {
  my: 'y',
  your_m: 'ik',
  your_f: 'ich', 
  your_pl: 'kum',
  our: 'na',
  his: 'ah',
  her: 'aha',
  their: 'ahum'
};

console.log('Fixing feminine possessive forms...\n');

nounsToFix.forEach(fix => {
  const noun = logicData.items.find(item => item.id === fix.id);
  if (!noun) {
    console.log(`⚠️  Could not find noun with ID ${fix.id}`);
    return;
  }
  
  console.log(`Fixing: ${noun.chat} (${noun.eng})`);
  
  // Fix chat possessive forms
  Object.keys(possessiveChatSuffixes).forEach(possessiveType => {
    const suffix = possessiveChatSuffixes[possessiveType];
    const newValue = fix.correctChatRoot + suffix;
    const oldValue = noun[`${possessiveType}_chat`];
    
    noun[`${possessiveType}_chat`] = newValue;
    console.log(`  ${possessiveType}_chat: ${oldValue} -> ${newValue}`);
  });
  
  console.log('');
});

// Special fixes for 'ekht' - it doesn't need the 't' transformation
const ekhtNoun = logicData.items.find(item => item.id === 161);
if (ekhtNoun && ekhtNoun.chat === 'ekht') {
  console.log('Special fix for ekht (sister) - removing extra t:');
  
  // Arabic possessive suffixes for feminine
  const arabicSuffixes = {
    my: 'ي',
    your_m: 'ك', 
    your_f: 'ج',
    your_pl: 'كم',
    our: 'نا',
    his: 'ه',
    her: 'ها',
    their: 'هم'
  };
  
  Object.keys(arabicSuffixes).forEach(possessiveType => {
    const suffix = arabicSuffixes[possessiveType];
    const chatSuffix = possessiveChatSuffixes[possessiveType];
    
    ekhtNoun[possessiveType] = 'إخت' + suffix;
    ekhtNoun[`${possessiveType}_chat`] = 'ekht' + chatSuffix;
    
    console.log(`  ${possessiveType}: إخت${suffix} (ekht${chatSuffix})`);
  });
}

// Fix 7erma - should be 7ermt not 7ermat
const ermaNouns = logicData.items.filter(item => item.chat === '7erma');
ermaNouns.forEach(noun => {
  if (noun.my_chat && noun.my_chat.includes('7ermat')) {
    console.log('\nFixing 7erma (wife) possessives:');
    
    Object.keys(possessiveChatSuffixes).forEach(possessiveType => {
      const suffix = possessiveChatSuffixes[possessiveType];
      const oldValue = noun[`${possessiveType}_chat`];
      noun[`${possessiveType}_chat`] = '7ermt' + suffix;
      console.log(`  ${possessiveType}_chat: ${oldValue} -> ${'7ermt' + suffix}`);
    });
    
    // Fix Arabic too
    const arabicSuffixes = {
      my: 'تي', your_m: 'تك', your_f: 'تج', your_pl: 'تكم',
      our: 'تنا', his: 'ته', her: 'تها', their: 'تهم'
    };
    
    Object.keys(arabicSuffixes).forEach(possessiveType => {
      const suffix = arabicSuffixes[possessiveType];
      noun[possessiveType] = 'حرم' + suffix;
    });
  }
});

// Save the updated logic.json
fs.writeFileSync('./logic.json', JSON.stringify(logicData, null, 2));

console.log('\n🎉 Fixed feminine possessive forms!');
console.log('📁 Updated logic.json saved');