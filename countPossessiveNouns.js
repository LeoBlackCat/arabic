const data = require('./logic.json');

const nounsWithPossessives = data.items.filter(item => 
  item.pos === 'noun' && 
  item.my && item.your_m && item.your_f && item.your_pl && 
  item.our && item.his && item.her && item.their
);

// Filter out alternates
const alternateNounIds = new Set();
nounsWithPossessives.forEach(noun => {
  if (noun.alternate) {
    alternateNounIds.add(noun.alternate);
  }
});

const finalNouns = nounsWithPossessives.filter(noun => 
  !alternateNounIds.has(noun.id)
);

console.log(`Total nouns with possessives: ${nounsWithPossessives.length}`);
console.log(`Nouns available for PossessiveGame (excluding alternates): ${finalNouns.length}`);
console.log('\nNouns available for the game:');
finalNouns.forEach((noun, i) => {
  console.log(`${i+1}. ${noun.chat} (${noun.eng}) - ${noun.gender}`);
});