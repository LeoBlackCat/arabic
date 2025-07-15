const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Read sentences.txt and pick 5 sentences with colors/adjectives/conjunctions
const pickSentences = () => {
  console.log('📝 Reading sentences.txt...');
  const sentencesPath = path.join(__dirname, 'sentences.txt');
  const sentences = fs.readFileSync(sentencesPath, 'utf8').split('\n').filter(line => line.trim().length > 0);
  
  // Filter sentences with colors, adjectives, conjunctions
  const keywords = ['a7mar', 'asfar', 'azrag', 'aswad', 'akhdhar', 'abyadh', 'banafsajee', 'bonnee', 'wardee', 
                   'kebeer', 'segheer', '7elo', 'zain', 'ladheedh', 'bas', 'ma3', 'wayed', 'bser3ah', 'eshway'];
  
  const filteredSentences = sentences.filter(sentence => 
    keywords.some(keyword => sentence.includes(keyword))
  );
  
  console.log(`🔍 Found ${filteredSentences.length} sentences with colors/adjectives/conjunctions`);
  
  // Pick 5 sentences
  const selectedSentences = filteredSentences.slice(0, 5);
  console.log('✅ Selected 5 sentences:');
  selectedSentences.forEach((sentence, index) => {
    console.log(`${index + 1}. ${sentence}`);
  });
  
  return selectedSentences;
};

// Check if sentences.json exists and load it, or create new structure
const loadSentencesData = () => {
  const sentencesJsonPath = path.join(__dirname, 'sentences.json');
  
  if (fs.existsSync(sentencesJsonPath)) {
    console.log('📄 Loading existing sentences.json...');
    return JSON.parse(fs.readFileSync(sentencesJsonPath, 'utf8'));
  } else {
    console.log('📄 Creating new sentences.json...');
    return {
      sentences: []
    };
  }
};

// Generate English and chat versions using OpenAI
const generateTranslations = async (arabicSentence) => {
  console.log(`🔄 Generating translations for: ${arabicSentence}`);
  
  const prompt = `You are an Arabic language expert. Given this Arabic sentence in chat format (Arabizi/Franco-Arabic), provide:
1. English translation
2. Clean chat format version (remove any punctuation/formatting)

Arabic sentence: ${arabicSentence}

Respond in JSON format:
{
  "english": "English translation here",
  "chat": "clean chat format here"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an Arabic language expert who provides accurate translations and clean formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.1
    });
    
    const result = JSON.parse(response.choices[0].message.content.trim());
    console.log(`✅ Generated - English: "${result.english}", Chat: "${result.chat}"`);
    return result;
  } catch (error) {
    console.error(`❌ Error generating translations:`, error);
    return null;
  }
};

// Generate Arabic audio using ElevenLabs
const generateAudio = async (arabicText, filename) => {
  console.log(`🔊 Generating audio for: ${arabicText}`);
  
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const VOICE_ID = 'jAAHNNqlbAX9iWjJPEtE'; // Requested voice
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: arabicText,
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
    const audioPath = path.join(__dirname, 'sounds', `${filename}.mp3`);
    
    // Create sounds directory if it doesn't exist
    const soundsDir = path.join(__dirname, 'sounds');
    if (!fs.existsSync(soundsDir)) {
      fs.mkdirSync(soundsDir, { recursive: true });
    }
    
    fs.writeFileSync(audioPath, Buffer.from(audioBuffer));
    console.log(`✅ Audio saved to: ${audioPath}`);
    return audioPath;
  } catch (error) {
    console.error(`❌ Error generating audio:`, error);
    return null;
  }
};

// Generate images using OpenAI
const generateImages = async (englishSentence, baseFilename) => {
  console.log(`🎨 Generating images for: ${englishSentence}`);
  
  try {
    // Generate 4 images - 1 correct + 3 distractors
    const prompts = [
      `${englishSentence} - realistic photo style`,
      `Person eating different colored food - realistic photo style`,
      `Family member with different colored object - realistic photo style`,
      `Person with different colored clothing - realistic photo style`
    ];
    
    const imageUrls = [];
    
    for (let i = 0; i < 4; i++) {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompts[i],
        n: 1,
        size: "1024x1024",
        quality: "standard"
      });
      
      imageUrls.push(response.data[0].url);
      console.log(`✅ Generated image ${i + 1}/4`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Download and save images to pictures folder
    const imagePaths = [];
    const picturesDir = path.join(__dirname, 'pictures');
    if (!fs.existsSync(picturesDir)) {
      fs.mkdirSync(picturesDir, { recursive: true });
    }
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageResponse = await fetch(imageUrls[i]);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imagePath = path.join(picturesDir, `${baseFilename}_${i + 1}.png`);
      
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
      imagePaths.push(`/pictures/${baseFilename}_${i + 1}.png`);
      console.log(`✅ Image ${i + 1} saved to: ${imagePath}`);
    }
    
    return imagePaths;
  } catch (error) {
    console.error(`❌ Error generating images:`, error);
    return null;
  }
};

// Main function to build the minigame
const buildMinigame = async () => {
  console.log('🚀 Building sentence minigame...');
  
  // Step 1: Pick 5 sentences
  const selectedSentences = pickSentences();
  
  // Step 2: Load existing sentences.json data
  const sentencesData = loadSentencesData();
  
  // Step 3: Process each sentence
  for (let i = 0; i < selectedSentences.length; i++) {
    const sentence = selectedSentences[i];
    console.log(`\n🎯 Processing sentence ${i + 1}/5: ${sentence}`);
    
    // Check if sentence already exists
    const exists = sentencesData.sentences.some(s => s.arabic === sentence);
    if (exists) {
      console.log('⚠️  Sentence already exists, skipping...');
      continue;
    }
    
    // Generate translations
    const translations = await generateTranslations(sentence);
    if (!translations) continue;
    
    // Generate filename
    const filename = `sentence_${Date.now()}_${i}`;
    
    // Generate audio
    const audioPath = await generateAudio(sentence, filename);
    if (!audioPath) continue;
    
    // Generate images
    const imagePaths = await generateImages(translations.english, filename);
    if (!imagePaths) continue;
    
    // Add to sentences data
    sentencesData.sentences.push({
      id: filename,
      arabic: sentence,
      chat: translations.chat,
      english: translations.english,
      audioPath: audioPath,
      images: imagePaths,
      correctImageIndex: 0, // First image is always correct
      createdAt: new Date().toISOString()
    });
    
    console.log(`✅ Successfully processed sentence ${i + 1}`);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Step 4: Save sentences.json
  const sentencesJsonPath = path.join(__dirname, 'sentences.json');
  fs.writeFileSync(sentencesJsonPath, JSON.stringify(sentencesData, null, 2));
  console.log(`\n💾 Saved sentences.json with ${sentencesData.sentences.length} sentences`);
  
  console.log('\n🎉 Minigame data generation complete!');
  console.log('Next steps:');
  console.log('1. Create React component for the minigame');
  console.log('2. Add play button functionality');
  console.log('3. Add 4-image selection interface');
};

// Run the script
if (require.main === module) {
  buildMinigame();
}

module.exports = { buildMinigame };