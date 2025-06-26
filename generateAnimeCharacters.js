/**
 * generateAnimeCharacters.js
 * 
 * Generates anime-style character images for the Arabic conversation game
 * using AI image generation APIs (DALL-E, Midjourney, or Stable Diffusion)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Character definitions
const CHARACTERS = {
  character1: {
    name: 'Amir',
    gender: 'male',
    description: 'friendly young Arab man with dark hair and warm brown eyes'
  },
  character2: {
    name: 'Layla', 
    gender: 'female',
    description: 'cheerful young Arab woman with long dark hair and bright green eyes'
  }
};

// Expression types
const EXPRESSIONS = {
  neutral: 'calm and attentive expression',
  happy: 'bright smile and sparkling eyes, very pleased',
  encouraging: 'warm encouraging smile, nodding approvingly',
  confused: 'slightly puzzled expression, head tilted thoughtfully'
};

// Time contexts for backgrounds
const TIME_CONTEXTS = {
  morning: 'bright morning sunlight, clear blue sky',
  evening: 'warm golden sunset, soft orange lighting',
  general: 'soft natural lighting, pleasant atmosphere'
};

// Base style prompt for consistency
const BASE_STYLE = 'anime style, high quality digital art, vibrant colors, detailed character design, clean lines, Studio Ghibli inspired, suitable for children';

// Directory setup
const charactersDir = path.join(__dirname, 'public', 'characters');
const backgroundsDir = path.join(__dirname, 'public', 'backgrounds');

// Ensure directories exist
function ensureDirectories() {
  [charactersDir, backgroundsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Generate character image prompts
function generateCharacterPrompt(characterId, expression, timeContext) {
  const character = CHARACTERS[characterId];
  const expressionDesc = EXPRESSIONS[expression];
  const contextDesc = TIME_CONTEXTS[timeContext];
  
  return `${BASE_STYLE}, portrait of ${character.description}, ${expressionDesc}, ${contextDesc}, wearing casual modern Middle Eastern clothing, friendly and approachable for language learning app, wholesome and educational`;
}

// Generate background prompts
function generateBackgroundPrompt(timeContext) {
  const contextDesc = TIME_CONTEXTS[timeContext];
  
  const backgrounds = {
    morning: `${BASE_STYLE}, beautiful Middle Eastern courtyard in the morning, ${contextDesc}, traditional architecture with modern touches, peaceful learning environment, no people`,
    evening: `${BASE_STYLE}, cozy Middle Eastern cafe in the evening, ${contextDesc}, warm interior lighting, comfortable seating area, peaceful atmosphere, no people`,
    general: `${BASE_STYLE}, modern Arabic classroom or study room, soft natural lighting, colorful educational posters on walls, inviting learning space, no people`
  };
  
  return backgrounds[timeContext];
}

// DALL-E API integration
async function generateWithDALLE(prompt, filename) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  });

  if (!response.ok) {
    throw new Error(`DALL-E API error: ${response.statusText}`);
  }

  const data = await response.json();
  const imageUrl = data.data[0].url;
  
  // Download the image
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.buffer();
  
  // Save to file
  fs.writeFileSync(filename, imageBuffer);
  console.log(`✅ Generated: ${filename}`);
}

// Stable Diffusion API integration (using Replicate)
async function generateWithStableDiffusion(prompt, filename) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('REPLICATE_API_TOKEN not found in environment');
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
      input: {
        prompt: prompt,
        negative_prompt: 'nsfw, adult content, inappropriate, violence, scary',
        width: 1024,
        height: 1024,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 50,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Replicate API error: ${response.statusText}`);
  }

  const prediction = await response.json();
  
  // Poll for completion
  let result = prediction;
  while (result.status === 'starting' || result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });
    
    result = await statusResponse.json();
  }

  if (result.status === 'succeeded' && result.output && result.output[0]) {
    // Download the image
    const imageResponse = await fetch(result.output[0]);
    const imageBuffer = await imageResponse.buffer();
    
    // Save to file
    fs.writeFileSync(filename, imageBuffer);
    console.log(`✅ Generated: ${filename}`);
  } else {
    throw new Error(`Image generation failed: ${result.error || 'Unknown error'}`);
  }
}

// Generate all character images
async function generateAllCharacters() {
  console.log('🎨 Generating character images...');
  
  for (const [characterId, character] of Object.entries(CHARACTERS)) {
    for (const expression of Object.keys(EXPRESSIONS)) {
      for (const timeContext of Object.keys(TIME_CONTEXTS)) {
        const filename = path.join(charactersDir, `${characterId}_${expression}_${timeContext}.png`);
        
        if (fs.existsSync(filename)) {
          console.log(`⏭️  Skipping existing: ${characterId}_${expression}_${timeContext}.png`);
          continue;
        }
        
        const prompt = generateCharacterPrompt(characterId, expression, timeContext);
        console.log(`🔄 Generating ${characterId} (${expression}, ${timeContext})...`);
        console.log(`📝 Prompt: ${prompt}`);
        
        try {
          // Use DALL-E by default, fallback to Stable Diffusion
          if (process.env.OPENAI_API_KEY) {
            await generateWithDALLE(prompt, filename);
          } else if (process.env.REPLICATE_API_TOKEN) {
            await generateWithStableDiffusion(prompt, filename);
          } else {
            console.log(`❌ No API keys found. Please set OPENAI_API_KEY or REPLICATE_API_TOKEN`);
            return;
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Error generating ${characterId}_${expression}_${timeContext}: ${error.message}`);
        }
      }
    }
  }
}

// Generate background images
async function generateAllBackgrounds() {
  console.log('🖼️  Generating background images...');
  
  for (const timeContext of Object.keys(TIME_CONTEXTS)) {
    const filename = path.join(backgroundsDir, `${timeContext}.jpg`);
    
    if (fs.existsSync(filename)) {
      console.log(`⏭️  Skipping existing background: ${timeContext}.jpg`);
      continue;
    }
    
    const prompt = generateBackgroundPrompt(timeContext);
    console.log(`🔄 Generating ${timeContext} background...`);
    console.log(`📝 Prompt: ${prompt}`);
    
    try {
      if (process.env.OPENAI_API_KEY) {
        await generateWithDALLE(prompt, filename);
      } else if (process.env.REPLICATE_API_TOKEN) {
        await generateWithStableDiffusion(prompt, filename);
      } else {
        console.log(`❌ No API keys found. Please set OPENAI_API_KEY or REPLICATE_API_TOKEN`);
        return;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error generating ${timeContext} background: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 Starting anime character and background generation...');
  
  ensureDirectories();
  
  try {
    await generateAllCharacters();
    await generateAllBackgrounds();
    console.log('🎉 All images generated successfully!');
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

// Export functions for programmatic use
module.exports = {
  generateCharacterPrompt,
  generateBackgroundPrompt,
  generateWithDALLE,
  generateWithStableDiffusion,
  generateAllCharacters,
  generateAllBackgrounds,
  CHARACTERS,
  EXPRESSIONS,
  TIME_CONTEXTS
};

// Run if called directly
if (require.main === module) {
  main();
}