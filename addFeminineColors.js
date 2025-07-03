const fs = require('fs');
const logicData = require('./logic.json');

// Feminine forms of colors in Arabic
const colorFeminineForms = {
  // Red
  'a7mar': { ar_f: 'حمراء', chat_f: '7amra' },
  // Yellow
  'asfar': { ar_f: 'صفراء', chat_f: 'safra' },
  // Blue
  'azrag': { ar_f: 'زرقاء', chat_f: 'zarga' },
  // White
  'abyadh': { ar_f: 'بيضاء', chat_f: 'baidha' },
  // Black
  'aswad': { ar_f: 'سوداء', chat_f: 'sawda' },
  // Green
  'akhdhar': { ar_f: 'خضراء', chat_f: 'khadhra' },
  // Gray
  'rusasee': { ar_f: 'رصاصية', chat_f: 'rusaseeyah' },
  // Pink
  'wardee': { ar_f: 'وردية', chat_f: 'wardeeyah' },
  // Purple
  'banafsajee': { ar_f: 'بنفسجية', chat_f: 'banafsajeeyah' },
  // Brown
  'bonnee': { ar_f: 'بنية', chat_f: 'bonneeyah' },
  // Orange
  'burtuqalee': { ar_f: 'برتقالية', chat_f: 'burtuqaleeyah' },
  // Silver
  'fedhee': { ar_f: 'فضية', chat_f: 'fedheeyah' },
  // Golden
  'thahabee': { ar_f: 'ذهبية', chat_f: 'thahabeeyah' }
};

console.log('Adding feminine forms to colors...\n');

// Find all color items
const colors = logicData.items.filter(item => item.type === 'colors');

console.log(`Found ${colors.length} colors to update:`);

colors.forEach((color, index) => {
  const feminineForms = colorFeminineForms[color.chat];
  
  if (feminineForms) {
    console.log(`[${index + 1}/${colors.length}] ${color.chat} (${color.eng})`);
    console.log(`  Masculine: ${color.ar} (${color.chat})`);
    console.log(`  Feminine:  ${feminineForms.ar_f} (${feminineForms.chat_f})`);
    
    // Add feminine forms to the color object
    color.ar_f = feminineForms.ar_f;
    color.chat_f = feminineForms.chat_f;
    color.eng = color.eng; // Keep the same English name
    
    console.log(`  ✅ Added feminine forms\n`);
  } else {
    console.log(`⚠️  No feminine forms defined for ${color.chat}`);
  }
});

// Save the updated logic.json
fs.writeFileSync('./logic.json', JSON.stringify(logicData, null, 2));

console.log('🎉 Successfully added feminine forms to all colors!');
console.log('📁 Updated logic.json saved');

// Show summary
console.log('\n📊 Summary of colors with both forms:');
const updatedColors = logicData.items.filter(item => item.type === 'colors');
updatedColors.forEach(color => {
  if (color.ar_f && color.chat_f) {
    console.log(`${color.eng}: ${color.ar} (${color.chat}) / ${color.ar_f} (${color.chat_f})`);
  }
});