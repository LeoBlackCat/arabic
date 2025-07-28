const fs = require('fs');
const path = require('path');

// Read the existing logic.json
const logicPath = path.join(__dirname, 'logic.json');
const logic = JSON.parse(fs.readFileSync(logicPath, 'utf8'));

// Read the new words file
const newWordsPath = path.join(__dirname, 'new words 0719.txt');
const newWordsContent = fs.readFileSync(newWordsPath, 'utf8');

// Read the new phrases file
const newPhrasesPath = path.join(__dirname, 'new phrases 0719.txt');
const newPhrasesContent = fs.readFileSync(newPhrasesPath, 'utf8');

// Find the highest existing ID
let maxId = Math.max(...logic.items.map(item => item.id));

console.log(`Starting from ID: ${maxId + 1}`);

// Parse new words (format: English\nArabizi alternating lines)
const newWordsLines = newWordsContent.split('\n').filter(line => line.trim());
const newWords = [];

for (let i = 0; i < newWordsLines.length; i += 2) {
    if (i + 1 < newWordsLines.length) {
        const english = newWordsLines[i].trim();
        const arabizi = newWordsLines[i + 1].trim();
        
        if (english && arabizi) {
            newWords.push({
                id: ++maxId,
                ar: '', // We'll need to add Arabic script later
                chat: arabizi,
                eng: english,
                type: 'word'
            });
        }
    }
}

console.log(`Parsed ${newWords.length} new words`);

// Parse new phrases (format: English\nArabizi alternating lines) 
const newPhrasesLines = newPhrasesContent.split('\n').filter(line => line.trim());
const newPhrases = [];

for (let i = 0; i < newPhrasesLines.length; i += 2) {
    if (i + 1 < newPhrasesLines.length) {
        const english = newPhrasesLines[i].trim();
        const arabizi = newPhrasesLines[i + 1].trim();
        
        if (english && arabizi) {
            newPhrases.push({
                id: ++maxId,
                ar: '', // We'll need to add Arabic script later
                chat: arabizi,
                eng: english,
                type: 'phrase'
            });
        }
    }
}

console.log(`Parsed ${newPhrases.length} new phrases`);

// Add new items to logic
logic.items.push(...newWords, ...newPhrases);

// Write back to logic.json
fs.writeFileSync(logicPath, JSON.stringify(logic, null, 2));

console.log(`Successfully added ${newWords.length + newPhrases.length} new items to logic.json`);
console.log(`New highest ID: ${maxId}`);

// Generate a summary
console.log('\n=== SUMMARY ===');
console.log(`Total items in logic.json: ${logic.items.length}`);
console.log(`Added words: ${newWords.length}`);
console.log(`Added phrases: ${newPhrases.length}`);

// Show some examples
console.log('\n=== SAMPLE NEW WORDS ===');
newWords.slice(0, 5).forEach(word => {
    console.log(`${word.id}: ${word.eng} = ${word.chat}`);
});

console.log('\n=== SAMPLE NEW PHRASES ===');
newPhrases.slice(0, 5).forEach(phrase => {
    console.log(`${phrase.id}: ${phrase.eng} = ${phrase.chat}`);
});

console.log('\nNote: Arabic script (ar field) is empty and will need to be added later.');