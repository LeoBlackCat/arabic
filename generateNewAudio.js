/**
 * generateNewAudio.js
 *
 * Generates audio files for new items in logic.json (ID >= 220) using ElevenLabs TTS API.
 * Only processes items that don't already have corresponding audio files.
 *
 * Prerequisites:
 * 1. Add ELEVENLABS_API_KEY=<your_key_here> to a .env file in the project root.
 * 2. Ensure you have node-fetch installed: npm install node-fetch
 *
 * Run with: node generateNewAudio.js
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// ElevenLabs configuration
const voiceId = 'jAAHNNqlbAX9iWjJPEtE';
const modelId = 'eleven_flash_v2_5';
const voiceSettings = {
  stability: 1,
  similarity_boost: 1,
  speed: 0.7
};

const soundsDir = path.join(__dirname, 'sounds');
const logic = require('./logic.json');

/**
 * Replace characters that are illegal in filenames with a dash.
 */
function sanitizeFilename(str) {
  return str.replace(/[\\/:"*?<>|]/g, '-').trim();
}

/**
 * Collect new phrases from logic.json (ID >= 220) that need audio generation.
 */
function collectNewPhrases() {
  const newItems = [];

  if (Array.isArray(logic.items)) {
    logic.items.forEach((item) => {
      // Only process items with ID >= 220 (the new items)
      if (item.id >= 220 && item.chat && item.ar) {
        newItems.push({
          id: item.id,
          chat: item.chat,
          ar: item.ar,
          eng: item.eng || '',
          type: item.type || 'unknown'
        });
      }
    });
  }

  return newItems;
}

/**
 * Request TTS from ElevenLabs and save it to the specified path.
 */
async function downloadAudio(text, outPath) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set in the environment (.env)');
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const payload = {
    text,
    model_id: modelId,
    voice_settings: voiceSettings,
  };

  console.log(`🔊  Requesting TTS for: "${text}"`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/wav',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
}

/**
 * Add a delay between API calls to avoid rate limiting.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🎵 Generating audio for new items (ID >= 220) using ElevenLabs API...\n');
  
  if (!fs.existsSync(soundsDir)) {
    console.log('📁 Creating sounds directory...');
    fs.mkdirSync(soundsDir);
  }

  const newItems = collectNewPhrases();
  console.log(`📋 Found ${newItems.length} new items to process\n`);

  if (newItems.length === 0) {
    console.log('✅ No new items found (ID >= 220) or all audio files already exist');
    return;
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of newItems) {
    const filename = `${sanitizeFilename(item.chat)}.wav`;
    const filePath = path.join(soundsDir, filename);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${filename} (already exists)`);
      skipped++;
      continue;
    }

    console.log(`\n🎯 Processing item ${item.id}: ${item.eng || item.ar}`);
    console.log(`   Arabic: ${item.ar}`);
    console.log(`   Chat: ${item.chat}`);
    console.log(`   Type: ${item.type}`);
    console.log(`   File: ${filename}`);

    try {
      await downloadAudio(item.ar, filePath);
      console.log(`✅ Successfully saved ${filename}`);
      processed++;
      
      // Add delay between requests to be respectful to the API
      if (processed < newItems.length - skipped) {
        console.log('⏱️  Waiting 1 second before next request...');
        await delay(1000);
      }
    } catch (err) {
      console.error(`❌ Failed to generate audio for "${item.ar}": ${err.message}`);
      failed++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully processed: ${processed}`);
  console.log(`   ⏭️  Skipped (already exist): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Audio files saved to: ${soundsDir}`);
}

// Execute if run directly
if (require.main === module) {
  main().catch((err) => {
    console.error('💥 Script error:', err);
    process.exit(1);
  });
}