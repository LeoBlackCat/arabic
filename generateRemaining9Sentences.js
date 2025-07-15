const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate remaining 9 sentences
const generateRemaining9Sentences = async () => {
  const remainingSentences = [
    {
      id: 'sentence_12',
      arabic: 'abu yashteree el la7am el taazaj',
      chat: 'abu yashteree el la7am el taazaj',
      english: 'Dad buys the fresh meat',
      audioFilename: 'sentence_12',
      imageFilename: 'sentence_12',
      correctPrompt: 'Middle-aged man buying fresh meat at a butcher shop - realistic photo style',
      distractorPrompts: [
        'Middle-aged man buying old meat at a butcher shop - realistic photo style',
        'Middle-aged woman buying fresh meat at a butcher shop - realistic photo style',
        'Middle-aged man buying fresh fish at a fish market - realistic photo style'
      ]
    },
    {
      id: 'sentence_13',
      arabic: 'bentee takteb el waajeb bser3ah',
      chat: 'bentee takteb el waajeb bser3ah',
      english: 'My daughter writes the homework quickly',
      audioFilename: 'sentence_13',
      imageFilename: 'sentence_13',
      correctPrompt: 'Young girl writing homework quickly at a desk - realistic photo style',
      distractorPrompts: [
        'Young girl writing homework slowly at a desk - realistic photo style',
        'Young boy writing homework quickly at a desk - realistic photo style',
        'Young girl reading homework quickly at a desk - realistic photo style'
      ]
    },
    {
      id: 'sentence_14',
      arabic: 'ne7an naseer el bait el kebeer',
      chat: 'ne7an naseer el bait el kebeer',
      english: 'We go to the big house',
      audioFilename: 'sentence_14',
      imageFilename: 'sentence_14',
      correctPrompt: 'Family walking towards a big house - realistic photo style',
      distractorPrompts: [
        'Family walking towards a small house - realistic photo style',
        'Person walking towards a big house - realistic photo style',
        'Family walking towards a big building instead of house - realistic photo style'
      ]
    },
    {
      id: 'sentence_15',
      arabic: 'ana ashoof el burj el 3alee',
      chat: 'ana ashoof el burj el 3alee',
      english: 'I see the tall tower',
      audioFilename: 'sentence_15',
      imageFilename: 'sentence_15',
      correctPrompt: 'Person looking up at a tall tower - realistic photo style',
      distractorPrompts: [
        'Person looking up at a short tower - realistic photo style',
        'Person looking down at a tall tower - realistic photo style',
        'Person looking up at a tall building instead of tower - realistic photo style'
      ]
    },
    {
      id: 'sentence_16',
      arabic: 'hum yashraboon el 3aseer el bared',
      chat: 'hum yashraboon el 3aseer el bared',
      english: 'They drink the cold juice',
      audioFilename: 'sentence_16',
      imageFilename: 'sentence_16',
      correctPrompt: 'Group of people drinking cold juice from glasses - realistic photo style',
      distractorPrompts: [
        'Group of people drinking hot juice from glasses - realistic photo style',
        'Person drinking cold juice from a glass - realistic photo style',
        'Group of people drinking cold water from glasses - realistic photo style'
      ]
    },
    {
      id: 'sentence_17',
      arabic: 'zauj yatbakh el 3aish el asfar',
      chat: 'zauj yatbakh el 3aish el asfar',
      english: 'Husband cooks the yellow rice',
      audioFilename: 'sentence_17',
      imageFilename: 'sentence_17',
      correctPrompt: 'Man cooking yellow rice in a kitchen - realistic photo style',
      distractorPrompts: [
        'Man cooking white rice in a kitchen - realistic photo style',
        'Woman cooking yellow rice in a kitchen - realistic photo style',
        'Man cooking yellow pasta in a kitchen - realistic photo style'
      ]
    },
    {
      id: 'sentence_18',
      arabic: 'ana agra el jareedah el jadeedah',
      chat: 'ana agra el jareedah el jadeedah',
      english: 'I read the new newspaper',
      audioFilename: 'sentence_18',
      imageFilename: 'sentence_18',
      correctPrompt: 'Person reading a new newspaper - realistic photo style',
      distractorPrompts: [
        'Person reading an old newspaper - realistic photo style',
        'Person reading a new magazine - realistic photo style',
        'Person writing on a new newspaper - realistic photo style'
      ]
    },
    {
      id: 'sentence_19',
      arabic: 'ekht tashteree el thob el wardee',
      chat: 'ekht tashteree el thob el wardee',
      english: 'Sister buys the pink dress',
      audioFilename: 'sentence_19',
      imageFilename: 'sentence_19',
      correctPrompt: 'Young woman buying a pink dress at a clothing store - realistic photo style',
      distractorPrompts: [
        'Young woman buying a blue dress at a clothing store - realistic photo style',
        'Young man buying a pink dress at a clothing store - realistic photo style',
        'Young woman buying a pink shirt at a clothing store - realistic photo style'
      ]
    },
    {
      id: 'sentence_20',
      arabic: 'ana amshee fee el 7adeeqah el 7elwah',
      chat: 'ana amshee fee el 7adeeqah el 7elwah',
      english: 'I walk in the beautiful garden',
      audioFilename: 'sentence_20',
      imageFilename: 'sentence_20',
      correctPrompt: 'Person walking in a beautiful garden with flowers - realistic photo style',
      distractorPrompts: [
        'Person walking in an ugly garden with dead plants - realistic photo style',
        'Person running in a beautiful garden with flowers - realistic photo style',
        'Person walking in a beautiful park instead of garden - realistic photo style'
      ]
    }
  ];

  console.log('🎵 Generating remaining 9 sentences...');

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = 'jAAHNNqlbAX9iWjJPEtE';

  for (let sentenceIndex = 0; sentenceIndex < remainingSentences.length; sentenceIndex++) {
    const sentence = remainingSentences[sentenceIndex];
    console.log(`\n🎯 Processing ${sentenceIndex + 1}/9: ${sentence.english}`);
    
    // Check if audio already exists
    const audioPath = path.join(__dirname, 'sounds', `${sentence.audioFilename}.mp3`);
    if (!fs.existsSync(audioPath)) {
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
        fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
        console.log(`✅ Audio saved to: ${audioPath}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error generating audio:`, error);
        continue;
      }
    } else {
      console.log(`✅ Audio already exists for ${sentence.audioFilename}`);
    }
    
    // Generate images
    console.log(`🎨 Generating contextual images...`);
    const allPrompts = [sentence.correctPrompt, ...sentence.distractorPrompts];
    
    for (let i = 0; i < 4; i++) {
      const imagePath = path.join(__dirname, 'pictures', `${sentence.imageFilename}_${i + 1}.png`);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`🎨 Generating image ${i + 1}/4 for ${sentence.imageFilename}...`);
        
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
          
          const imageDownloadResponse = await fetch(imageUrl);
          const imageBuffer = await imageDownloadResponse.arrayBuffer();
          
          fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
          console.log(`✅ Image ${i + 1} saved to: ${imagePath}`);
          
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`❌ Error generating image ${i + 1}:`, error);
        }
      } else {
        console.log(`✅ Image ${i + 1} already exists for ${sentence.imageFilename}`);
      }
    }
    
    console.log(`✅ Completed sentence: ${sentence.id}`);
  }
  
  // Update sentences.json
  console.log('\n📝 Updating sentences.json...');
  
  const sentencesPath = path.join(__dirname, 'sentences.json');
  const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
  
  // Add new sentences that don't already exist
  for (const sentence of remainingSentences) {
    const exists = sentencesData.sentences.some(s => s.id === sentence.id);
    if (!exists) {
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
  }
  
  fs.writeFileSync(sentencesPath, JSON.stringify(sentencesData, null, 2));
  console.log(`✅ Updated sentences.json`);
  
  // Copy to public directory
  fs.writeFileSync(path.join(__dirname, 'public', 'sentences.json'), JSON.stringify(sentencesData, null, 2));
  console.log(`✅ Updated public/sentences.json`);
  
  console.log('\n🎉 Remaining sentences generation complete!');
  console.log(`📊 Total sentences: ${sentencesData.sentences.length}`);
};

// Run the script
if (require.main === module) {
  generateRemaining9Sentences().catch(console.error);
}

module.exports = { generateRemaining9Sentences };