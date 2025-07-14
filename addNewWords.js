const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Arabizi to Arabic transliteration mapping
const arabicMap = {
  '3': 'ع', '2': 'أ', '5': 'خ', '6': 'ط', '7': 'ح', '8': 'ق', '9': 'ص',
  'a': 'ا', 'b': 'ب', 't': 'ت', 'th': 'ث', 'j': 'ج', '7': 'ح',
  'kh': 'خ', 'd': 'د', 'th': 'ذ', 'r': 'ر', 'z': 'ز', 's': 'س',
  'sh': 'ش', 's': 'ص', 'd': 'ض', 't': 'ط', 'th': 'ظ', '3': 'ع',
  'gh': 'غ', 'f': 'ف', 'q': 'ق', 'k': 'ك', 'l': 'ل', 'm': 'م',
  'n': 'ن', 'h': 'ه', 'w': 'و', 'y': 'ي', 'e': 'ي', 'i': 'ي',
  'o': 'و', 'u': 'و'
};

// Manual mapping for better accuracy
const manualMappings = {
  'taawlah': 'طاولة',
  '3eshreen': 'عشرين',
  'thalatheen': 'ثلاثين', 
  'arba3een': 'أربعين',
  'khamseen': 'خمسين',
  'sitteen': 'ستين',
  'sab3een': 'سبعين',
  'thamaneen': 'ثمانين',
  'tes3een': 'تسعين',
  'emyah': 'مئة',
  'miyyah': 'مئة',
  'ummee': 'أمي',
  'ubooy': 'أبوي',
  'ukhooy': 'أخوي',
  'ekhtee': 'أختي',
  'waladee': 'ولدي',
  'bentee': 'بنتي',
  'zoojee': 'زوجي',
  'rayylee': 'رييلي',
  'zoojtee': 'زوجتي',
  '7ermetee': 'حرمتي',
  '3yaalee': 'عيالي',
  'segheer': 'صغير',
  'segheerah': 'صغيرة',
  'kebeer': 'كبير',
  'taweel': 'طويل',
  'geseer': 'قصير',
  'saree3': 'سريع',
  'bser3ah': 'بسرعة',
  'rekhees': 'رخيص',
  'ghalee': 'غالي',
  'bas': 'بس',
  'zain': 'زين',
  '7elo': 'حلو',
  'waseem': 'وسيم',
  'jameel': 'جميل',
  'jameelah': 'جميلة',
  '7elwah': 'حلوة'
};

// Use OpenAI to convert arabizi to Arabic
async function arabiziToArabic(arabizi) {
  // Check manual mappings first
  if (manualMappings[arabizi]) {
    return manualMappings[arabizi];
  }
  
  // Handle compound words like "emyah/miyyah"
  if (arabizi.includes('/')) {
    const parts = arabizi.split('/');
    const converted = await Promise.all(parts.map(async part => {
      if (manualMappings[part]) {
        return manualMappings[part];
      }
      return await convertWithOpenAI(part);
    }));
    return converted.join('/');
  }
  
  // Use OpenAI for conversion
  return await convertWithOpenAI(arabizi);
}

async function convertWithOpenAI(arabizi) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in Arabic transliteration. Convert the given arabizi (Arabic written in Latin script) to proper Arabic script. Return only the Arabic text, no explanations."
        },
        {
          role: "user",
          content: `Convert this arabizi to Arabic: ${arabizi}`
        }
      ],
      max_tokens: 50,
      temperature: 0
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error converting ${arabizi}:`, error.message);
    return arabizi; // fallback to original
  }
}

// Parse the new words file
async function parseNewWords(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const words = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (i + 1 < lines.length) {
      const arabizi = lines[i].trim();
      const english = lines[i + 1].trim();
      
      const arabic = await arabiziToArabic(arabizi);
      
      // Determine part of speech and type
      let pos = 'noun'; // default
      let type = null;
      
      // Numbers
      if (/^\d+$/.test(english) || english.toLowerCase().includes('hundred')) {
        pos = 'numeral';
      }
      // Adjectives (common patterns)
      else if (['small', 'big', 'long', 'tall', 'short', 'fast', 'cheap', 'expensive', 'good', 'bad', 'nice', 'pleasant', 'handsome', 'beautiful'].includes(english.toLowerCase())) {
        pos = 'adjective';
      }
      // Adverbs
      else if (english.toLowerCase().includes('quickly') || arabizi === 'bser3ah') {
        pos = 'adverb';
      }
      // Family terms
      else if (['my mother', 'my father', 'my brother', 'my sister', 'my son', 'my daughter', 'my husband', 'my wife', 'my kids'].includes(english.toLowerCase())) {
        pos = 'noun';
        type = 'family';
      }
      
      const wordObj = {
        arabizi,
        english,
        arabic,
        pos
      };
      
      if (type) {
        wordObj.type = type;
      }
      
      words.push(wordObj);
    }
  }
  
  return words;
}

// Add words to logic.json
function addToLogicJson(words) {
  const logic = JSON.parse(fs.readFileSync('logic.json', 'utf8'));
  
  // Find the highest existing ID
  let maxId = Math.max(...logic.items.map(item => item.id || 0));
  
  // Add new words
  words.forEach(word => {
    maxId++;
    
    const newItem = {
      id: maxId,
      ar: word.arabic,
      chat: word.arabizi,
      eng: word.english,
      pos: word.pos
    };
    
    if (word.type) {
      newItem.type = word.type;
    }
    
    logic.items.push(newItem);
  });
  
  // Write back to file
  fs.writeFileSync('logic.json', JSON.stringify(logic, null, 2));
  
  return words.length;
}

// Main execution
async function main() {
  try {
    console.log('Parsing new words...');
    const words = await parseNewWords('new words 0712');
    
    console.log(`Found ${words.length} words:`);
    words.forEach(word => {
      const typeStr = word.type ? ` (${word.type})` : '';
      console.log(`${word.arabizi} (${word.arabic}) - ${word.english} [${word.pos}${typeStr}]`);
    });
    
    console.log('\nAdding to logic.json...');
    const added = addToLogicJson(words);
    console.log(`Successfully added ${added} words to logic.json`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();