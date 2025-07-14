const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getCorrectArabic(arabizi, english) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in Arabic language and transliteration. Given arabizi (Arabic written in Latin script) and its English meaning, provide the correct Arabic spelling. Return only the Arabic text, no explanations or additional text."
        },
        {
          role: "user",
          content: `Arabizi: ${arabizi}\nEnglish: ${english}\n\nPlease provide the correct Arabic spelling:`
        }
      ],
      max_tokens: 50,
      temperature: 0
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error getting Arabic for ${arabizi}:`, error.message);
    return null;
  }
}

async function fixArabicSpellings() {
  // Read logic.json
  const logic = JSON.parse(fs.readFileSync('logic.json', 'utf8'));
  
  // Find items with id >= 180
  const itemsToFix = logic.items.filter(item => item.id >= 180);
  
  console.log(`Found ${itemsToFix.length} items to fix (id >= 180)`);
  
  // Process each item
  for (let i = 0; i < itemsToFix.length; i++) {
    const item = itemsToFix[i];
    console.log(`\nProcessing ${i + 1}/${itemsToFix.length}: ${item.chat} (${item.eng})`);
    
    const correctArabic = await getCorrectArabic(item.chat, item.eng);
    
    if (correctArabic && correctArabic !== item.ar) {
      console.log(`  Old: ${item.ar}`);
      console.log(`  New: ${correctArabic}`);
      
      // Update the item in the main array
      const itemIndex = logic.items.findIndex(logicItem => logicItem.id === item.id);
      if (itemIndex !== -1) {
        logic.items[itemIndex].ar = correctArabic;
      }
    } else {
      console.log(`  Keeping: ${item.ar}`);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Write back to logic.json
  fs.writeFileSync('logic.json', JSON.stringify(logic, null, 2));
  console.log(`\nSuccessfully updated Arabic spellings for ${itemsToFix.length} items`);
}

// Run the script
fixArabicSpellings().catch(console.error);