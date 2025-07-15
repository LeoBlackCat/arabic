const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate more sentences with contextually similar distractors
const generateMoreSentences = async () => {
  const newSentences = [
    {
      id: 'sentence_6',
      arabic: 'ana ashrab el chai el asfar',
      chat: 'ana ashrab el chai el asfar',
      english: 'I drink the yellow tea',
      audioFilename: 'sentence_6',
      imageFilename: 'sentence_6',
      correctPrompt: 'Person drinking yellow/golden tea from a cup - realistic photo style',
      distractorPrompts: [
        'Person drinking red tea from a cup - realistic photo style',
        'Person drinking yellow coffee from a cup - realistic photo style',
        'Person drinking blue/dark tea from a cup - realistic photo style'
      ]
    },
    {
      id: 'sentence_7',
      arabic: 'ekhtee 3endhaa kitaab azrag',
      chat: 'ekhtee 3endhaa kitaab azrag',
      english: 'My sister has a blue book',
      audioFilename: 'sentence_7',
      imageFilename: 'sentence_7',
      correctPrompt: 'Young woman holding a blue book and smiling - realistic photo style',
      distractorPrompts: [
        'Young woman holding a red book and smiling - realistic photo style',
        'Young man holding a blue book and smiling - realistic photo style',
        'Young woman holding a blue notebook instead of book - realistic photo style'
      ]
    },
    {
      id: 'sentence_8',
      arabic: 'ukhooy yasoog el sayyaarah el akhdhar',
      chat: 'ukhooy yasoog el sayyaarah el akhdhar',
      english: 'My brother drives the green car',
      audioFilename: 'sentence_8',
      imageFilename: 'sentence_8',
      correctPrompt: 'Young man driving a green car - realistic photo style',
      distractorPrompts: [
        'Young man driving a red car - realistic photo style',
        'Young woman driving a green car - realistic photo style',
        'Young man driving a green truck instead of car - realistic photo style'
      ]
    }
  ];

  console.log('🎵 Generating more sentences with contextual distractors...');

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = 'jAAHNNqlbAX9iWjJPEtE';

  for (const sentence of newSentences) {
    console.log(`\n🎯 Processing: ${sentence.english}`);
    
    // Generate audio
    console.log(`🎤 Generating audio for: ${sentence.arabic}`);
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: sentence.arabic,
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
      const audioPath = path.join(__dirname, 'sounds', `${sentence.audioFilename}.mp3`);
      
      fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
      console.log(`✅ Audio saved to: ${audioPath}`);
      
      // Small delay before generating images
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error generating audio:`, error);
      continue;
    }
    
    // Generate images
    console.log(`🎨 Generating contextual images...`);
    const allPrompts = [sentence.correctPrompt, ...sentence.distractorPrompts];
    
    for (let i = 0; i < 4; i++) {
      console.log(`🎨 Generating image ${i + 1}/4 for ${sentence.imageFilename}...`);
      console.log(`📝 Prompt: ${allPrompts[i]}`);
      
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: allPrompts[i],
          n: 1,
          size: "1024x1024",
          quality: "standard"
        });
        
        const imageUrl = imageResponse.data[0].url;
        console.log(`✅ Generated image ${i + 1}/4`);
        
        // Download and save image
        const imageDownloadResponse = await fetch(imageUrl);
        const imageBuffer = await imageDownloadResponse.arrayBuffer();
        const imagePath = path.join(__dirname, 'pictures', `${sentence.imageFilename}_${i + 1}.png`);
        
        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
        console.log(`✅ Image ${i + 1} saved to: ${imagePath}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`❌ Error generating image ${i + 1}:`, error);
      }
    }
    
    console.log(`✅ Completed sentence: ${sentence.id}`);
  }
  
  // Update sentences.json with new entries
  console.log('\n📝 Updating sentences.json...');
  
  const sentencesPath = path.join(__dirname, 'sentences.json');
  const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
  
  // Add new sentences
  for (const sentence of newSentences) {
    sentencesData.sentences.push({
      id: sentence.id,
      arabic: sentence.arabic,
      chat: sentence.chat,
      english: sentence.english,
      audioPath: `/sounds/${sentence.audioFilename}.mp3`,
      images: [
        `/pictures/${sentence.imageFilename}_1.png`,
        `/pictures/${sentence.imageFilename}_2.png`,
        `/pictures/${sentence.imageFilename}_3.png`,
        `/pictures/${sentence.imageFilename}_4.png`
      ],
      correctImageIndex: 0,
      createdAt: new Date().toISOString()
    });
  }
  
  fs.writeFileSync(sentencesPath, JSON.stringify(sentencesData, null, 2));
  console.log(`✅ Updated sentences.json with ${newSentences.length} new sentences`);
  
  // Copy to public directory
  fs.writeFileSync(path.join(__dirname, 'public', 'sentences.json'), JSON.stringify(sentencesData, null, 2));
  console.log(`✅ Updated public/sentences.json`);
  
  console.log('\n🎉 Additional sentences generation complete!');
  console.log(`Total sentences: ${sentencesData.sentences.length}`);
};

// Run the script
if (require.main === module) {
  generateMoreSentences();
}

module.exports = { generateMoreSentences };