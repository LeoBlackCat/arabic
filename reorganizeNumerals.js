const fs = require('fs');

function reorganizeNumerals() {
  // Read logic.json
  const logic = JSON.parse(fs.readFileSync('logic.json', 'utf8'));
  
  // Find all numeral items
  const numeralItems = logic.items.filter(item => item.pos === 'numeral');
  console.log(`Found ${numeralItems.length} numeral items to move`);
  
  // Remove numerals from items array
  logic.items = logic.items.filter(item => item.pos !== 'numeral');
  console.log(`Remaining items after removing numerals: ${logic.items.length}`);
  
  // Reenumerate items array (starting from 1)
  logic.items.forEach((item, index) => {
    item.id = index + 1;
  });
  console.log('Reenumerated items array');
  
  // Initialize numerals array if it doesn't exist
  if (!logic.numerals) {
    logic.numerals = [];
  }
  
  // Convert numerals to new format and add to numerals array
  numeralItems.forEach(item => {
    // Extract numeric value from English field
    let value = parseInt(item.eng);
    
    // Handle special cases
    if (item.eng === '100' || item.chat === 'emyah/miyyah') {
      value = 100;
    }
    
    // Keep chat as is - "3" is the letter "ع" in arabizi
    let chat = item.chat;
    
    const numeral = {
      value: value,
      ar: item.ar,
      chat: chat
    };
    
    logic.numerals.push(numeral);
    console.log(`Added numeral: ${value} (${chat} - ${item.ar})`);
  });
  
  // Sort numerals by value
  logic.numerals.sort((a, b) => a.value - b.value);
  
  // Write back to logic.json
  fs.writeFileSync('logic.json', JSON.stringify(logic, null, 2));
  
  console.log(`\nSummary:`);
  console.log(`- Moved ${numeralItems.length} numerals to numerals array`);
  console.log(`- Reenumerated ${logic.items.length} items`);
  console.log(`- Total numerals in numerals array: ${logic.numerals.length}`);
}

// Run the script
try {
  reorganizeNumerals();
  console.log('\nSuccessfully reorganized numerals and reenumerated items');
} catch (error) {
  console.error('Error:', error.message);
}