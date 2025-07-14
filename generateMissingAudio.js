 /**
 * generateMissingAudio.js
 *
 * Scans logic.json for phrases, checks if a corresponding .wav audio file exists in the
 * sounds/ directory, and if not, fetches it from the ElevenLabs TTS API.
 *
 * Prerequisites:
 * 1. Add ELEVENLABS_API_KEY=<your_key_here> to a .env file in the project root.
 * 2. Set the voice ID you wish to use in the `voiceId` constant below.
 *
 * Run with:  node generateMissingAudio.js
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// TODO: Replace this with your preferred ElevenLabs voice ID
//const voiceId = 'jAAHNNqlbAX9iWjJPEtE';
const voiceId = 'DANw8bnAVbjDEHwZIoYa';

const soundsDir = path.join(__dirname, 'sounds');
const logic = require('./logic.json');

/**
 * Replace characters that are illegal in filenames with a dash.
 * We intentionally leave spaces because existing files use them.
 */
function sanitizeFilename(str) {
  return str.replace(/[\\/:"*?<>|]/g, '-').trim();
}

/**
 * Collect all phrases from logic.json that require audio.
 * Looks in both `items` and `numerals` arrays for an object key called `chat`.
 */
function collectPhrases() {
  // Map chat => ar
  const map = new Map();

  const add = (chat, ar) => {
    if (!chat) return;
    if (!map.has(chat)) {
      map.set(chat, ar || chat);
    }
  };

  if (Array.isArray(logic.items)) {
    logic.items.forEach((item) => add(item.chat, item.ar));
  }

  if (Array.isArray(logic.numerals)) {
    logic.numerals.forEach((num) => add(num.chat, num.ar));
  }

  // Convert to array of {chat, ar}
  return Array.from(map.entries()).map(([chat, ar]) => ({ chat, ar }));
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
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
      speed: 0.7
    },
  };

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

async function main() {
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir);
  }

    const phrases = collectPhrases();
  console.log(`Found ${phrases.length} phrases in logic.json`);

  for (const { chat, ar } of phrases) {
    const filename = `${sanitizeFilename(chat)}.wav`;
    const filePath = path.join(soundsDir, filename);

    if (fs.existsSync(filePath)) {
      console.log(`✅  ${filename} already exists`);
      continue;
    }

    console.log(`🔄  Generating audio for "${ar}" (file: ${filename})`);
    try {
      await downloadAudio(ar, filePath);
      console.log(`🎉  Saved ${filename}`);
    } catch (err) {
      console.error(`❌  Failed to generate "${ar}": ${err.message}`);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}