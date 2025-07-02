const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const logicData = require('./logic.json');

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

// Ensure pictures directory exists
const PICTURES_DIR = path.join(__dirname, 'pictures');
if (!fs.existsSync(PICTURES_DIR)) {
  fs.mkdirSync(PICTURES_DIR, { recursive: true });
  console.log('📁 Created pictures directory');
}

// Cultural context prompts for UAE/Dubai
const getContextualPrompt = (englishWord, arabicWord) => {
  const word = englishWord.toLowerCase();
  
  // Food and drink items
  if (['water', 'tea', 'coffee', 'juice', 'milk'].includes(word)) {
    return `${englishWord} served in traditional Arabic/Emirati style, elegant Middle Eastern presentation`;
  }
  
  if (['fish', 'chicken', 'meat'].includes(word)) {
    return `${englishWord} prepared in traditional Emirati cuisine style, Middle Eastern cooking`;
  }
  
  if (['salad', 'soup', 'cheese', 'bread', 'rice'].includes(word)) {
    return `${englishWord} in traditional Arabic/Middle Eastern style, authentic regional cuisine`;
  }
  
  if (['fruits', 'vegetables'].includes(word)) {
    return `${englishWord} commonly found in UAE markets, Middle Eastern varieties`;
  }
  
  if (['chocolate', 'sweets'].includes(word)) {
    return `${englishWord} in Arabic/Middle Eastern style, traditional regional confections`;
  }
  
  if (['sugar', 'salt'].includes(word)) {
    return `${englishWord} in traditional Arabic/Middle Eastern packaging and presentation`;
  }
  
  // Family members
  if (['mother', 'father'].includes(word)) {
    return `Emirati ${englishWord} in traditional UAE family setting, warm and dignified`;
  }
  
  if (['brother', 'sister'].includes(word)) {
    return `Emirati ${englishWord} in modern UAE setting, contemporary Middle Eastern style`;
  }
  
  if (['husband', 'wife'].includes(word)) {
    return `Emirati ${englishWord} in traditional UAE family context, respectful representation`;
  }
  
  if (word === 'children') {
    return `Emirati children in UAE family setting, happy and playful, traditional and modern elements`;
  }
  
  // Objects and places
  if (['car', 'vehicle'].includes(word)) {
    return `${englishWord} in Dubai streets, modern UAE cityscape background`;
  }
  
  if (['house', 'home'].includes(word)) {
    return `Traditional Emirati ${englishWord} architecture in UAE, modern Arabic design`;
  }
  
  if (['door', 'gate'].includes(word)) {
    return `Traditional Arabic/Emirati ${englishWord} design, Middle Eastern architectural style`;
  }
  
  if (['chair', 'furniture'].includes(word)) {
    return `Traditional Arabic/Middle Eastern ${englishWord} design, elegant regional style`;
  }
  
  if (['table'].includes(word)) {
    return `Arabic/Middle Eastern dining ${englishWord}, traditional regional furniture`;
  }
  
  if (['tower', 'building'].includes(word)) {
    return `Modern ${englishWord} in Dubai skyline, UAE architecture`;
  }
  
  if (['bag', 'purse'].includes(word)) {
    return `Elegant ${englishWord} in Middle Eastern/Arabic style, traditional and modern design`;
  }
  
  if (['book'].includes(word)) {
    return `Arabic ${englishWord} with traditional calligraphy, Middle Eastern educational context`;
  }
  
  if (['apartment', 'flat'].includes(word)) {
    return `Modern UAE ${englishWord} interior, contemporary Middle Eastern design`;
  }
  
  if (['money', 'currency'].includes(word)) {
    return `UAE dirhams and ${englishWord}, Middle Eastern currency context`;
  }
  
  if (['work', 'job'].includes(word)) {
    return `Professional ${englishWord} environment in UAE, modern Middle Eastern workplace`;
  }
  
  if (['workplace', 'office'].includes(word)) {
    return `Modern UAE ${englishWord}, contemporary Middle Eastern professional setting`;
  }
  
  if (['name', 'identity'].includes(word)) {
    return `Arabic calligraphy showing a ${englishWord}, traditional Middle Eastern script`;
  }
  
  // Default fallback with UAE context
  return `${englishWord} in UAE/Dubai context, Middle Eastern Arabic cultural setting`;
};

// Function to call OpenAI DALL-E API
async function generateImage(prompt) {
  const requestBody = {
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    style: "natural"
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestBody);
    
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && response.data[0] && response.data[0].url) {
            resolve(response.data[0].url);
          } else {
            reject(new Error(`Invalid response: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Function to download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (error) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(error);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Function to process a single noun
async function processNoun(noun) {
  const filename = `${noun.chat.toLowerCase()}.png`;
  const filepath = path.join(PICTURES_DIR, filename);
  
  // Skip if image already exists
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  Skipping ${noun.chat} - image already exists`);
    return;
  }
  
  try {
    console.log(`🎨 Generating image for "${noun.eng}" (${noun.ar} - ${noun.chat})`);
    
    const prompt = getContextualPrompt(noun.eng, noun.ar);
    console.log(`   Prompt: ${prompt}`);
    
    const imageUrl = await generateImage(prompt);
    console.log(`📥 Downloading image for ${noun.chat}...`);
    
    await downloadImage(imageUrl, filepath);
    console.log(`✅ Successfully saved ${filename}`);
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error(`❌ Failed to process ${noun.chat}: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting image download for Arabic nouns...');
  console.log(`📁 Images will be saved to: ${PICTURES_DIR}`);
  
  // Get all nouns from logic.json
  const nouns = logicData.items.filter(item => item.pos === 'noun');
  console.log(`📝 Found ${nouns.length} nouns to process`);
  
  // Process each noun
  for (let i = 0; i < nouns.length; i++) {
    const noun = nouns[i];
    console.log(`\n[${i + 1}/${nouns.length}] Processing: ${noun.eng}`);
    await processNoun(noun);
  }
  
  console.log('\n🎉 Image download process completed!');
  console.log(`📁 Check the pictures folder: ${PICTURES_DIR}`);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🖼️  Arabic Nouns Image Downloader

Usage: node downloadImages.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be downloaded without actually downloading
  
Environment:
  OPENAI_API_KEY  Your OpenAI API key (required)
  
Examples:
  node downloadImages.js                 # Download all missing images
  node downloadImages.js --dry-run       # Show what would be downloaded
  
The script will:
  1. Load nouns from logic.json
  2. Generate culturally appropriate prompts for UAE/Dubai context
  3. Use DALL-E 3 to generate images
  4. Download images to ./pictures/ folder
  5. Skip existing images automatically
  `);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 DRY RUN - Showing what would be downloaded:\n');
  
  const nouns = logicData.items.filter(item => item.pos === 'noun');
  
  nouns.forEach((noun, index) => {
    const filename = `${noun.chat.toLowerCase()}.png`;
    const filepath = path.join(PICTURES_DIR, filename);
    const exists = fs.existsSync(filepath);
    const prompt = getContextualPrompt(noun.eng, noun.ar);
    
    console.log(`[${index + 1}/${nouns.length}] ${noun.eng} (${noun.chat})`);
    console.log(`   File: ${filename} ${exists ? '✅ EXISTS' : '🔄 WOULD DOWNLOAD'}`);
    console.log(`   Prompt: ${prompt}\n`);
  });
  
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, processNoun, getContextualPrompt };