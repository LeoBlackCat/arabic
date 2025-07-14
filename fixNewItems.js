const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateArabic(chat, eng) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in Arabic language. Given arabizi (Arabic written in Latin script) and its English meaning, provide the correct Arabic spelling. Return only the Arabic text, no explanations."
        },
        {
          role: "user",
          content: `Arabizi: ${chat}\nEnglish: ${eng}\n\nProvide the correct Arabic spelling:`
        }
      ],
      max_tokens: 50,
      temperature: 0
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error generating Arabic for ${chat}:`, error.message);
    return null;
  }
}

async function fixNewItems() {
  // Read logic.json
  const logic = JSON.parse(fs.readFileSync('logic.json', 'utf8'));
  
  console.log('Processing new items after ID 204...');
  
  // Find items without IDs (they should be after the last item with ID 204)
  let foundLast = false;
  let newItems = [];
  let processedItems = [];
  
  for (let i = 0; i < logic.items.length; i++) {
    const item = logic.items[i];
    
    if (item.id === 204) {
      foundLast = true;
      processedItems.push(item);
    } else if (foundLast && !item.id) {
      // This is a new item that needs processing
      newItems.push(item);
    } else if (!foundLast) {
      processedItems.push(item);
    }
  }
  
  console.log(`Found ${newItems.length} new items to process`);
  
  // Process new items
  let currentId = 205; // Start from 205
  
  for (let i = 0; i < newItems.length; i++) {
    const item = newItems[i];
    
    // Add ID
    item.id = currentId;
    
    // Generate Arabic if missing
    if (!item.ar && item.chat && item.eng) {
      console.log(`Generating Arabic for: ${item.chat} (${item.eng})`);
      item.ar = await generateArabic(item.chat, item.eng);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    // Make eng lowercase
    if (item.eng) {
      item.eng = item.eng.toLowerCase();
    }
    
    console.log(`Processed item ${currentId}: ${item.chat} (${item.ar}) - ${item.eng}`);
    
    processedItems.push(item);
    currentId++;
  }
  
  // Handle last 4 items as alternatives (handsome/beautiful pairs)
  const totalItems = processedItems.length;
  const lastFourItems = processedItems.slice(-4);
  
  console.log('\nSetting up alternatives for last 4 items:');
  
  // Find handsome pair (waseem/jameel)
  let waseemItem = null;
  let jameelItem = null;
  
  // Find beautiful pair (7elwah/jameelah)  
  let helwahItem = null;
  let jameelahItem = null;
  
  for (let item of lastFourItems) {
    if (item.chat === 'waseem') waseemItem = item;
    if (item.chat === 'jameel') jameelItem = item;
    if (item.chat === '7elwah') helwahItem = item;
    if (item.chat === 'jameelah') jameelahItem = item;
  }
  
  // Set up alternates for handsome pair
  if (waseemItem && jameelItem) {
    waseemItem.alternate = jameelItem.id;
    jameelItem.alternate = waseemItem.id;
    console.log(`Set alternates: waseem (${waseemItem.id}) <-> jameel (${jameelItem.id})`);
  }
  
  // Set up alternates for beautiful pair
  if (helwahItem && jameelahItem) {
    helwahItem.alternate = jameelahItem.id;
    jameelahItem.alternate = helwahItem.id;
    console.log(`Set alternates: 7elwah (${helwahItem.id}) <-> jameelah (${jameelahItem.id})`);
  }
  
  // Update logic.json
  logic.items = processedItems;
  
  // Write back to logic.json
  fs.writeFileSync('logic.json', JSON.stringify(logic, null, 2));
  
  console.log(`\nSummary:`);
  console.log(`- Processed ${newItems.length} new items`);
  console.log(`- Added IDs from 205 to ${currentId - 1}`);
  console.log(`- Generated missing Arabic text`);
  console.log(`- Made all eng fields lowercase`);
  console.log(`- Set up alternates for last 4 items`);
  console.log(`- Total items: ${logic.items.length}`);
}

// Run the script
async function main() {
  try {
    await fixNewItems();
    console.log('\nSuccessfully fixed new items');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();