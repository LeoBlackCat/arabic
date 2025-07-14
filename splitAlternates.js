const fs = require('fs');

function splitAlternates() {
  // Read logic.json
  const logic = JSON.parse(fs.readFileSync('logic.json', 'utf8'));
  
  console.log('Processing items...');
  
  // Find husband and wife items (should be around ids 195-196 after previous reenumeration)
  let husbandItem = null;
  let wifeItem = null;
  
  // Search for the items by content since IDs might have changed
  for (let item of logic.items) {
    if (item.chat && item.chat.includes('/') && item.eng && item.eng.toLowerCase().includes('husband')) {
      husbandItem = item;
      console.log(`Found husband item: id ${item.id}, chat: ${item.chat}`);
    }
    if (item.chat && item.chat.includes('/') && item.eng && item.eng.toLowerCase().includes('wife')) {
      wifeItem = item;
      console.log(`Found wife item: id ${item.id}, chat: ${item.chat}`);
    }
  }
  
  let newItems = [];
  let currentId = 0;
  
  // Process each item
  for (let item of logic.items) {
    currentId++;
    
    // Make eng field lowercase
    if (item.eng) {
      item.eng = item.eng.toLowerCase();
    }
    
    // Handle husband item
    if (item === husbandItem) {
      // Split "zoojee/rayylee" into two items
      const chatParts = item.chat.split('/');
      const arParts = item.ar.split('/');
      
      // First item (zoojee)
      const item1 = {
        ...item,
        id: currentId,
        chat: chatParts[0], // zoojee
        ar: arParts[0], // زوجي
        alternate: currentId + 1
      };
      
      // Second item (rayylee)  
      const item2 = {
        ...item,
        id: currentId + 1,
        chat: chatParts[1], // rayylee
        ar: arParts.length > 1 ? arParts[1] : arParts[0], // راجلي or same Arabic
        alternate: currentId
      };
      
      newItems.push(item1);
      newItems.push(item2);
      currentId++; // increment again since we added 2 items
      
      console.log(`Split husband: ${item1.chat} (id ${item1.id}) <-> ${item2.chat} (id ${item2.id})`);
    }
    // Handle wife item
    else if (item === wifeItem) {
      // Split "zoojtee/7ermetee" into two items
      const chatParts = item.chat.split('/');
      const arParts = item.ar.split('/');
      
      // First item (zoojtee)
      const item1 = {
        ...item,
        id: currentId,
        chat: chatParts[0], // zoojtee
        ar: arParts[0], // زوجتي
        alternate: currentId + 1
      };
      
      // Second item (7ermetee)
      const item2 = {
        ...item,
        id: currentId + 1,
        chat: chatParts[1], // 7ermetee
        ar: arParts.length > 1 ? arParts[1] : 'حرمتي', // حرمتي
        alternate: currentId
      };
      
      newItems.push(item1);
      newItems.push(item2);
      currentId++; // increment again since we added 2 items
      
      console.log(`Split wife: ${item1.chat} (id ${item1.id}) <-> ${item2.chat} (id ${item2.id})`);
    }
    // Regular item
    else {
      item.id = currentId;
      newItems.push(item);
    }
  }
  
  // Update logic.json with new items array
  logic.items = newItems;
  
  // Write back to logic.json
  fs.writeFileSync('logic.json', JSON.stringify(logic, null, 2));
  
  console.log(`\nSummary:`);
  console.log(`- Total items after processing: ${newItems.length}`);
  console.log(`- Split husband item into 2 alternates`);
  console.log(`- Split wife item into 2 alternates`);
  console.log(`- Made all 'eng' fields lowercase`);
  console.log(`- Reenumerated all items`);
}

// Run the script
try {
  splitAlternates();
  console.log('\nSuccessfully split alternates and processed items');
} catch (error) {
  console.error('Error:', error.message);
}