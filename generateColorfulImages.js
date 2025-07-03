const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const logicData = require('./logic.json');

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

// Directory for colorful images
const COLORFUL_IMAGES_DIR = path.join(__dirname, 'colorful-images');
if (!fs.existsSync(COLORFUL_IMAGES_DIR)) {
  fs.mkdirSync(COLORFUL_IMAGES_DIR, { recursive: true });
  console.log('📁 Created colorful-images directory');
}

// Get all colors and colorful nouns
const colors = logicData.items.filter(item => item.type === 'colors');
const colorfulNouns = logicData.items.filter(item => 
  item.pos === 'noun' && item.colorful === true
);

console.log(`Found ${colors.length} colors and ${colorfulNouns.length} colorful nouns`);

// Special cases that get more colors (but not all)
const SPECIAL_NOUNS = ['sayyaarah', 'motar', 'sa3a']; // car, car(alt), watch

// Function to get random colors for a noun
const getColorsForNoun = (noun) => {
  if (SPECIAL_NOUNS.includes(noun.chat)) {
    // For special nouns, pick 4-5 colors instead of all 13
    const numColors = Math.floor(Math.random() * 2) + 4; // 4 or 5 colors
    const shuffled = [...colors].sort(() => 0.5 - Math.random());
    const selectedColors = shuffled.slice(0, numColors);
    console.log(`  🌟 Special noun ${noun.chat} - generating ${numColors} colors: ${selectedColors.map(c => c.eng).join(', ')}`);
    return selectedColors;
  }
  
  // For other nouns, pick only 1-2 colors to reduce total count
  const numColors = Math.floor(Math.random() * 2) + 1; // 1 or 2 colors
  const shuffled = [...colors].sort(() => 0.5 - Math.random());
  const selectedColors = shuffled.slice(0, numColors);
  
  console.log(`  🎲 Random selection for ${noun.chat}: ${selectedColors.map(c => c.eng).join(', ')}`);
  return selectedColors;
};

// Function to select subset of nouns to keep total ~30 images
const selectNounsForGeneration = (allColorfulNouns) => {
  // Always include special nouns (cars, watch)
  const specialSelected = allColorfulNouns.filter(noun => SPECIAL_NOUNS.includes(noun.chat));
  
  // Select a good variety of other nouns
  const others = allColorfulNouns.filter(noun => !SPECIAL_NOUNS.includes(noun.chat));
  
  // Pick ~12 other nouns to reach ~30 total images  
  // (3 special nouns × 5 colors = 15 images + 12 other nouns × 1-2 colors = ~27-30 total)
  const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
  const selectedOthers = shuffledOthers.slice(0, 12);
  
  const selected = [...specialSelected, ...selectedOthers];
  console.log(`📝 Selected nouns:`);
  console.log(`   Special: ${specialSelected.map(n => n.chat).join(', ')}`);
  console.log(`   Others: ${selectedOthers.map(n => n.chat).join(', ')}`);
  
  return selected;
};

// Function to get contextual prompt for UAE/Dubai
const getContextualPrompt = (noun, color, isGenderFeminine) => {
  const colorWord = isGenderFeminine ? color.eng.toLowerCase() : color.eng.toLowerCase();
  const nounWord = noun.eng.toLowerCase();
  
  // Base prompt with color and noun
  let prompt = `A ${colorWord} ${nounWord}`;
  
  // Add cultural context based on noun type
  if (nounWord.includes('car')) {
    prompt += ` in Dubai streets, modern UAE cityscape background, realistic automotive photography`;
  } else if (nounWord === 'watch') {
    prompt += `, luxury timepiece, elegant product photography`;
  } else if (['bag', 'purse', 'handbag'].some(word => nounWord.includes(word))) {
    prompt += `, elegant Middle Eastern style, luxury fashion photography`;
  } else if (['table', 'chair', 'furniture'].some(word => nounWord.includes(word))) {
    prompt += `, Arabic/Middle Eastern furniture design, elegant interior`;
  } else if (['juice', 'soup', 'salad'].some(word => nounWord.includes(word))) {
    prompt += `, traditional Middle Eastern cuisine style, food photography`;
  } else if (['vegetables', 'fruits'].some(word => nounWord.includes(word))) {
    prompt += `, fresh produce in UAE market style`;
  } else {
    prompt += `, Middle Eastern/Arabic cultural context`;
  }
  
  // Add quality specifications
  prompt += `, high quality, professional photography, clean background`;
  
  return prompt;
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

// Function to process a noun with specific colors
async function processNounWithColors(noun, colors) {
  const combinations = [];
  
  for (const color of colors) {
    // Determine if we should use feminine form based on noun gender
    const isNounFeminine = noun.gender === 'f';
    const colorForm = isNounFeminine ? 
      { ar: color.ar_f, chat: color.chat_f } : 
      { ar: color.ar, chat: color.chat };
      
    const filename = `${noun.chat}_${color.chat}.png`;
    const filepath = path.join(COLORFUL_IMAGES_DIR, filename);
    
    // Skip if image already exists
    if (fs.existsSync(filepath)) {
      console.log(`    ⏭️  Skipping ${filename} - already exists`);
      combinations.push({
        noun: noun.chat,
        color: color.chat,
        filename: filename,
        arabicPhrase: `${noun.ar} ${colorForm.ar}`,
        chatPhrase: `${noun.chat} ${colorForm.chat}`,
        englishPhrase: `${color.eng} ${noun.eng}`,
        nounGender: noun.gender,
        colorForm: isNounFeminine ? 'feminine' : 'masculine'
      });
      continue;
    }
    
    try {
      console.log(`    🎨 Generating: ${color.eng} ${noun.eng} (${isNounFeminine ? 'feminine' : 'masculine'})`);
      
      const prompt = getContextualPrompt(noun, color, isNounFeminine);
      console.log(`       Prompt: ${prompt}`);
      
      const imageUrl = await generateImage(prompt);
      console.log(`    📥 Downloading ${filename}...`);
      
      await downloadImage(imageUrl, filepath);
      console.log(`    ✅ Saved ${filename}`);
      
      // Store combination info
      combinations.push({
        noun: noun.chat,
        color: color.chat,
        filename: filename,
        arabicPhrase: `${noun.ar} ${colorForm.ar}`,
        chatPhrase: `${noun.chat} ${colorForm.chat}`,
        englishPhrase: `${color.eng} ${noun.eng}`,
        nounGender: noun.gender,
        colorForm: isNounFeminine ? 'feminine' : 'masculine'
      });
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`    ❌ Failed to generate ${filename}: ${error.message}`);
    }
  }
  
  return combinations;
}

// Main function
async function main() {
  console.log('🚀 Starting colorful image generation...');
  console.log(`📁 Images will be saved to: ${COLORFUL_IMAGES_DIR}`);
  
  const allCombinations = [];
  let totalImages = 0;
  
  // Limit to ~30 images total by selecting subset of nouns
  const selectedNouns = selectNounsForGeneration(colorfulNouns);
  
  // Calculate total expected images
  const expectedTotal = selectedNouns.reduce((total, noun) => {
    const numColors = SPECIAL_NOUNS.includes(noun.chat) ? 5 : 2; // Rough estimate
    return total + numColors;
  }, 0);
  
  console.log(`📊 Selected ${selectedNouns.length} nouns for generation (targeting ~30 images)`);
  console.log(`📊 Expected to generate ~${expectedTotal} images\n`);
  
  // Process each selected noun
  for (let i = 0; i < selectedNouns.length; i++) {
    const noun = selectedNouns[i];
    console.log(`[${i + 1}/${selectedNouns.length}] Processing: ${noun.chat} (${noun.eng}) - Gender: ${noun.gender}`);
    
    const selectedColors = getColorsForNoun(noun);
    const combinations = await processNounWithColors(noun, selectedColors);
    
    allCombinations.push(...combinations);
    totalImages += combinations.length;
    
    console.log(`  📈 Generated ${combinations.length} images for ${noun.chat}\n`);
  }
  
  // Save combinations data
  const combinationsData = {
    generatedAt: new Date().toISOString(),
    totalCombinations: allCombinations.length,
    totalImages: totalImages,
    nounsProcessed: selectedNouns.length,
    colorsAvailable: colors.length,
    combinations: allCombinations
  };
  
  const dataFilePath = path.join(COLORFUL_IMAGES_DIR, 'combinations.json');
  fs.writeFileSync(dataFilePath, JSON.stringify(combinationsData, null, 2));
  
  console.log('🎉 Colorful image generation completed!');
  console.log(`📊 Total images generated: ${totalImages}`);
  console.log(`📊 Total combinations: ${allCombinations.length}`);
  console.log(`📁 Images directory: ${COLORFUL_IMAGES_DIR}`);
  console.log(`📄 Combinations data: ${dataFilePath}`);
  
  // Show summary by noun
  console.log('\n📋 Summary by noun:');
  const nounSummary = {};
  allCombinations.forEach(combo => {
    if (!nounSummary[combo.noun]) nounSummary[combo.noun] = 0;
    nounSummary[combo.noun]++;
  });
  
  Object.entries(nounSummary).forEach(([noun, count]) => {
    console.log(`  ${noun}: ${count} color combinations`);
  });
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🌈 Colorful Images Generator

Usage: node generateColorfulImages.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be generated without actually generating

Environment:
  OPENAI_API_KEY  Your OpenAI API key (required)
  
The script will:
  1. Find all colorful nouns from logic.json
  2. Generate 3-4 random color combinations for each noun
  3. Generate ALL colors for special nouns (car, watch)
  4. Use proper gender agreement (feminine colors for feminine nouns)
  5. Save images to ./colorful-images/ directory
  6. Create combinations.json with all generated data
  `);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 DRY RUN - Showing what would be generated:\n');
  
  // Use the same selection logic as the main function
  const selectedNouns = selectNounsForGeneration(colorfulNouns);
  console.log('');
  
  selectedNouns.forEach((noun, index) => {
    console.log(`[${index + 1}/${selectedNouns.length}] ${noun.chat} (${noun.eng}) - Gender: ${noun.gender}`);
    const selectedColors = getColorsForNoun(noun);
    
    selectedColors.forEach(color => {
      const isNounFeminine = noun.gender === 'f';
      const colorForm = isNounFeminine ? 
        { ar: color.ar_f, chat: color.chat_f } : 
        { ar: color.ar, chat: color.chat };
      
      const filename = `${noun.chat}_${color.chat}.png`;
      const arabicPhrase = `${noun.ar} ${colorForm.ar}`;
      const chatPhrase = `${noun.chat} ${colorForm.chat}`;
      
      console.log(`  📸 ${filename}: ${arabicPhrase} (${chatPhrase}) - ${color.eng} ${noun.eng}`);
    });
    console.log('');
  });
  
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, processNounWithColors, getContextualPrompt };