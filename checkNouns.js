const data = require('./logic.json');
const nouns = data.items.filter(item => item.pos === 'noun');

console.log('Nouns missing possessive forms:');
nouns.forEach(noun => {
  const hasPossessives = noun.my && noun.your_m && noun.your_f && noun.our && noun.his && noun.her && noun.their;
  if (!hasPossessives) {
    console.log(`${noun.chat} (${noun.eng}) - ID: ${noun.id}, alternate: ${noun.alternate || 'none'}`);
  }
});

console.log('\nAlternate relationships:');
nouns.forEach(noun => {
  if (noun.alternate) {
    const alternate = nouns.find(n => n.id === noun.alternate);
    console.log(`${noun.chat} (${noun.eng}) -> ${alternate ? alternate.chat : 'NOT FOUND'} (${alternate ? alternate.eng : 'N/A'})`);
    
    const hasMainPossessives = noun.my && noun.your_m && noun.your_f;
    const hasAltPossessives = alternate && alternate.my && alternate.your_m && alternate.your_f;
    console.log(`  Main has possessives: ${hasMainPossessives}, Alternate has possessives: ${hasAltPossessives}`);
  }
});