const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate 12 more sentences with contextually similar distractors
const generate12MoreSentences = async () => {
  const newSentences = [
    {
      id: 'sentence_9',
      arabic: 'ana aroo7 el maktab bser3ah',
      chat: 'ana aroo7 el maktab bser3ah',
      english: 'I go to the office quickly',
      audioFilename: 'sentence_9',
      imageFilename: 'sentence_9',
      correctPrompt: 'Person walking quickly to an office building - realistic photo style',
      distractorPrompts: [
        'Person walking slowly to an office building - realistic photo style',
        'Person walking quickly to a hospital building - realistic photo style',
        'Person running quickly to an office building - realistic photo style'
      ]
    },
    {
      id: 'sentence_10',
      arabic: 'umm tashrab el mai el bared',
      chat: 'umm tashrab el mai el bared',
      english: 'Mom drinks the cold water',
      audioFilename: 'sentence_10',
      imageFilename: 'sentence_10',
      correctPrompt: 'Middle-aged woman drinking cold water from a glass - realistic photo style',
      distractorPrompts: [
        'Middle-aged woman drinking hot water from a glass - realistic photo style',
        'Young woman drinking cold water from a glass - realistic photo style',
        'Middle-aged woman drinking cold juice from a glass - realistic photo style'
      ]
    },
    {
      id: 'sentence_11',
      arabic: 'walad yal3ab ma3 el kurah el 7amra',
      chat: 'walad yal3ab ma3 el kurah el 7amra',
      english: 'The boy plays with the red ball',
      audioFilename: 'sentence_11',
      imageFilename: 'sentence_11',
      correctPrompt: 'Young boy playing with a red ball in a park - realistic photo style',
      distractorPrompts: [
        'Young boy playing with a blue ball in a park - realistic photo style',
        'Young girl playing with a red ball in a park - realistic photo style',
        'Young boy playing with a red toy car instead of ball - realistic photo style'
      ]
    },
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

  console.log('🎵 Generating 12 more sentences with contextual distractors...');

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = 'jAAHNNqlbAX9iWjJPEtE';

  for (let sentenceIndex = 0; sentenceIndex < newSentences.length; sentenceIndex++) {
    const sentence = newSentences[sentenceIndex];
    console.log(`\n🎯 Processing ${sentenceIndex + 1}/12: ${sentence.english}`);
    
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
            stability: 1,
            similarity_boost: 1,
            speed: 0.7
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
  
  console.log('\n🎉 12 additional sentences generation complete!');
  console.log(`📊 Total sentences: ${sentencesData.sentences.length}`);
  console.log(`🎵 Total audio files: ${sentencesData.sentences.length}`);
  console.log(`🎨 Total images: ${sentencesData.sentences.length * 4}`);
};

// Run the script
if (require.main === module) {
  generate12MoreSentences().catch(console.error);
}

module.exports = { generate12MoreSentences };