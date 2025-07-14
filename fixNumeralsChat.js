const fs = require('fs');

function fixNumeralsChat() {
  // Read logic.json
  const logic = JSON.parse(fs.readFileSync('logic.json', 'utf8'));
  
  // Fix the numerals that had "3" incorrectly removed
  const corrections = [
    { value: 20, correctChat: '3eshreen' }
  ];
  
  corrections.forEach(correction => {
    const numeral = logic.numerals.find(n => n.value === correction.value);
    if (numeral && numeral.chat !== correction.correctChat) {
      console.log(`Fixing ${numeral.value}: ${numeral.chat} -> ${correction.correctChat}`);
      numeral.chat = correction.correctChat;
    }
  });
  
  // Write back to logic.json
  fs.writeFileSync('logic.json', JSON.stringify(logic, null, 2));
  
  console.log('Fixed numeral chat fields');
}

// Run the script
try {
  fixNumeralsChat();
  console.log('Successfully fixed numerals chat fields');
} catch (error) {
  console.error('Error:', error.message);
}