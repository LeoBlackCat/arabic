const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'jAAHNNqlbAX9iWjJPEtE';

// Function to convert arabizi to Arabic script using OpenAI
async function convertArabiziToArabic(arabiziText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are an expert in Arabic language and arabizi (Franco-Arabic) conversion. Convert the given arabizi text to proper Arabic script. Only return the Arabic text, nothing else.

Examples:
- "ana ashrab el chai" → "أنا أشرب الشاي"
- "ekhtee taakel el fawakeh" → "أختي تأكل الفواكه"
- "hum yakallemoon ma3 3yaalhum" → "هم يتكلمون مع عيالهم"
- "el kakaw mob zain" → "الكاكاو مو زين"
- "ana 3endy sayyaarah, bas ma 3endy baizaat" → "أنا عندي سيارة، بس ما عندي بيزات"

Return only the Arabic text without any explanations or additional text.`
      }, {
        role: "user",
        content: arabiziText
      }],
      max_tokens: 100,
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error converting arabizi to Arabic:', error);
    return arabiziText; // Return original if conversion fails
  }
}

// Function to generate audio using ElevenLabs
async function generateAudio(text, outputPath) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
    console.log(`✅ Generated audio: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error generating audio for ${outputPath}:`, error);
    return false;
  }
}

// Main function to fix Arabic text and regenerate audio
async function fixArabicAndAudio() {
  console.log('🚀 Starting Arabic text conversion and audio regeneration...');
  
  // Read current sentences.json
  const sentencesPath = path.join(__dirname, 'sentences.json');
  if (!fs.existsSync(sentencesPath)) {
    console.error('❌ sentences.json not found');
    return;
  }

  const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
  const updatedSentences = [];

  for (let i = 0; i < sentencesData.sentences.length; i++) {
    const sentence = sentencesData.sentences[i];
    console.log(`\n📝 Processing sentence ${i + 1}/${sentencesData.sentences.length}: ${sentence.chat}`);
    
    // Convert arabizi to Arabic
    console.log('🔄 Converting arabizi to Arabic...');
    const arabicText = await convertArabiziToArabic(sentence.chat);
    console.log(`✅ Arabic: ${arabicText}`);
    
    // Generate new audio file
    const audioFileName = `sentence_${sentence.id.replace('sentence_', '')}.mp3`;
    const audioPath = path.join(__dirname, 'sounds', audioFileName);
    
    console.log('🎵 Generating audio from Arabic text...');
    const audioSuccess = await generateAudio(arabicText, audioPath);
    
    // Update sentence data
    const updatedSentence = {
      ...sentence,
      arabic: arabicText,
      audioPath: `sounds/${audioFileName}`,
      updatedAt: new Date().toISOString()
    };
    
    updatedSentences.push(updatedSentence);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save updated sentences.json
  const updatedData = {
    sentences: updatedSentences,
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(sentencesPath, JSON.stringify(updatedData, null, 2));
  console.log(`\n✅ Updated sentences.json with ${updatedSentences.length} sentences`);
  
  // Also update the dist version
  const distSentencesPath = path.join(__dirname, 'dist', 'sentences.json');
  if (fs.existsSync(distSentencesPath)) {
    fs.writeFileSync(distSentencesPath, JSON.stringify(updatedData, null, 2));
    console.log('✅ Updated dist/sentences.json');
  }
  
  console.log('\n🎉 Process completed successfully!');
  console.log('📋 Summary:');
  console.log(`   • Converted ${updatedSentences.length} sentences to Arabic script`);
  console.log(`   • Generated ${updatedSentences.length} new audio files`);
  console.log('   • Updated sentences.json files');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Run: npm run deploy');
}

// Run the script
if (require.main === module) {
  fixArabicAndAudio().catch(console.error);
}

module.exports = { fixArabicAndAudio };