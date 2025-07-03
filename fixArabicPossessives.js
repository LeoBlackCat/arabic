const fs = require('fs');
const logicData = require('./logic.json');

// Fix Arabic possessive forms for feminine nouns that had double letters
const nounsToFixArabic = [
  { id: 148, chat: 'shorbah', arabicRoot: 'شوربت' },
  { id: 154, chat: '7alawah', arabicRoot: 'حلاوت' },
  { id: 155, chat: 'khedhrah', arabicRoot: 'خضرت' },
  { id: 156, chat: 'shantah', arabicRoot: 'شنطت' },
  { id: 157, chat: 'taawlah', arabicRoot: 'طاولت' },
  { id: 164, chat: 'zoojah', arabicRoot: 'زوجت' }
];

// Arabic possessive suffixes for feminine nouns (with 't' transformation)
const arabicFeminineSuffixes = {
  my: 'ي',
  your_m: 'ك', 
  your_f: 'ج',
  your_pl: 'كم',
  our: 'نا',
  his: 'ه',
  her: 'ها',
  their: 'هم'
};

console.log('Fixing Arabic possessive forms for feminine nouns...\n');

nounsToFixArabic.forEach(fix => {
  const noun = logicData.items.find(item => item.id === fix.id);
  if (!noun) {
    console.log(`⚠️  Could not find noun with ID ${fix.id}`);
    return;
  }
  
  console.log(`Fixing Arabic for: ${noun.chat} (${noun.eng})`);
  
  // Fix Arabic possessive forms
  Object.keys(arabicFeminineSuffixes).forEach(possessiveType => {
    const suffix = arabicFeminineSuffixes[possessiveType];
    const newValue = fix.arabicRoot + suffix;
    const oldValue = noun[possessiveType];
    
    noun[possessiveType] = newValue;
    console.log(`  ${possessiveType}: ${oldValue} -> ${newValue}`);
  });
  
  console.log('');
});

// Save the updated logic.json
fs.writeFileSync('./logic.json', JSON.stringify(logicData, null, 2));

console.log('🎉 Fixed Arabic possessive forms!');
console.log('📁 Updated logic.json saved');