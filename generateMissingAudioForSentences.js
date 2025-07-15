const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Generate missing audio files for sentences
const generateMissingAudio = async () => {
  const sentences = [
    { id: 'sentence_1', text: 'Hum yakallemoon ma3 3yaalhum', filename: 'sentence_1752567730738_0' },
    { id: 'sentence_2', text: 'el kakaw mob zain', filename: 'sentence_1752567822896_1' },
    { id: 'sentence_3', text: 'ana 3endy sayyaarah, bas ma 3endy baizaat', filename: 'sentence_3' },
    { id: 'sentence_4', text: 'ekhtee taakel el fawakeh el 7elwah', filename: 'sentence_4' },
    { id: 'sentence_5', text: 'ukhooy yaakel el semach el asfar', filename: 'sentence_5' }
  ];

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = 'jAAHNNqlbAX9iWjJPEtE';

  console.log('🔊 Generating missing audio files...');

  for (const sentence of sentences) {
    const audioPath = path.join(__dirname, 'sounds', `${sentence.filename}.mp3`);
    
    if (fs.existsSync(audioPath)) {
      console.log(`✅ ${sentence.filename}.mp3 already exists, skipping...`);
      continue;
    }

    console.log(`🎤 Generating audio for: ${sentence.text}`);
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: sentence.text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const audioBuffer = await response.arrayBuffer();
      
      // Create sounds directory if it doesn't exist
      const soundsDir = path.join(__dirname, 'sounds');
      if (!fs.existsSync(soundsDir)) {
        fs.mkdirSync(soundsDir, { recursive: true });
      }
      
      fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
      console.log(`✅ Audio saved to: ${audioPath}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error generating audio for ${sentence.filename}:`, error);
    }
  }
  
  console.log('\n🎉 Audio generation complete!');
};

// Run the script
if (require.main === module) {
  generateMissingAudio();
}

module.exports = { generateMissingAudio };