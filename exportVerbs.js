const fs = require('fs');
const path = require('path');

// Read the logic.json file
const logicData = JSON.parse(fs.readFileSync('logic.json', 'utf8'));

// Extract verb conjugations
const verbConjugations = [];

logicData.items.forEach(item => {
  // Check if item is a verb and has conjugation fields
  if (item.pos === "verb" && item.you_m_chat) {
    const conjugation = {
      original: item.chat || '', // original form (my/I form)
      my_chat: item.chat || '', // same as original for verbs
      your_m_chat: item.you_m_chat || '',
      your_f_chat: item.you_f_chat || '',
      your_pl_chat: item.you_pl_chat || '',
      we_chat: item.we_chat || '',
      he_chat: item.he_chat || '',
      she_chat: item.she_chat || '',
      they_chat: item.they_chat || ''
    };
    verbConjugations.push(conjugation);
  }
});

// Create output text - one line per verb
let output = '';

verbConjugations.forEach((verb) => {
  output += `${verb.original}, ${verb.my_chat}, ${verb.your_m_chat}, ${verb.your_f_chat}, ${verb.your_pl_chat}, ${verb.we_chat}, ${verb.he_chat}, ${verb.she_chat}, ${verb.they_chat}\n`;
});

// Write to file
fs.writeFileSync('verb_conjugations.txt', output, 'utf8');
console.log(`Exported ${verbConjugations.length} verb conjugations to verb_conjugations.txt`);