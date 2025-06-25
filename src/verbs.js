// Import verbs data
const verbsData = require('../logic.json');
console.log('Loaded logic.json, number of items:', verbsData.items.length);

// Find verbs by their chat representation
const findVerbByChat = (chat) => {
  const verb = verbsData.items.find(item => 
    item.chat === chat // Exact match since we fixed the capitalization
  );
  if (verb) {
    console.log('Found verb for', chat, ':', verb);
  } else {
    console.log('No verb found for:', chat);
  }
  return verb;
};

// List of verbs we want to use (with correct capitalization)
const targetVerbs = [
  'A7eb', 'Aakel', 'Adfa3', 'Afta7', 'Agdar', 'Agoum', 'Agra', 'Akteb',
  'Al3ab', 'Anaam', 'Ashoof', 'Ashrab', 'Ashtegil', 'Asma3', 'Asoog',
  'Atbakh', 'Attesel'
];

// Get the full verb objects
const verbs = targetVerbs
  .map(chat => {
    console.log('Looking for verb:', chat);
    return findVerbByChat(chat);
  })
  .filter(verb => {
    if (!verb) {
      console.log('Filtered out undefined verb');
      return false;
    }
    return true;
  })
  .map(verb => {
    const verbObj = {
      path: `${verb.chat.toLowerCase()}.png`, // Keep lowercase for filenames
      url: `/pictures/${verb.chat.toLowerCase()}.png`, // Keep lowercase for filenames
      chat: verb.chat,
      ar: verb.ar,
      eng: verb.eng
    };
    console.log('Created verb object:', verbObj);
    return verbObj;
  });

console.log('Final verbs array length:', verbs.length);
console.log('Final verbs:', verbs.map(v => `${v.chat}: ${v.ar}`));

// Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Export both the original and a function to get shuffled verbs
const exportedVerbs = verbs;
const getShuffledVerbs = () => shuffleArray([...verbs]);

export { exportedVerbs as verbs, getShuffledVerbs };

// For debugging
console.log('Export complete - verbs:', exportedVerbs);
console.log('Export complete - getShuffledVerbs available.');

// Legacy CommonJS export for compatibility
module.exports = {
  verbs: exportedVerbs,
  getShuffledVerbs
};
