const fs = require('fs');
const path = require('path');

// Read and parse logic.json
const logicPath = path.join(__dirname, 'logic.json');
const logicData = JSON.parse(fs.readFileSync(logicPath, 'utf8'));

// Define all chat field variations to extract
const chatFields = [
  'chat', 'chat_f', 'my_chat', 'your_m_chat', 'your_f_chat', 'your_pl_chat',
  'our_chat', 'his_chat', 'her_chat', 'their_chat', 'you_m_chat', 'you_f_chat',
  'you_pl_chat', 'we_chat', 'he_chat', 'she_chat', 'they_chat'
];

// Extract all chat field values and numerals
const allChatNames = new Set();

logicData.items.forEach(item => {
  chatFields.forEach(field => {
    if (item[field]) {
      allChatNames.add(item[field]);
    }
  });
});

// Convert to array and sort
const chatNamesArray = Array.from(allChatNames).sort();

// Export the array
module.exports = chatNamesArray;

// Also log them for immediate viewing
console.log('All chat names (arabizi):');
chatNamesArray.forEach(name => {
  console.log(name);
});