const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'jAAHNNqlbAX9iWjJPEtE';

// Function to get all verbs from logic.json
function getVerbsFromLogic() {
  const logicPath = path.join(__dirname, 'logic.json');
  const logicData = JSON.parse(fs.readFileSync(logicPath, 'utf8'));
  
  // Filter items that are verbs (looking for "i " prefix in English)
  const verbs = logicData.items.filter(item => 
    item.eng && item.eng.toLowerCase().startsWith('i ')
  );
  
  return verbs;
}

// Function to get existing verbs from sentences.json
function getExistingVerbsFromSentences() {
  const sentencesPath = path.join(__dirname, 'sentences.json');
  if (!fs.existsSync(sentencesPath)) {
    return [];
  }
  
  const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
  const existingVerbs = new Set();
  
  // Extract verbs from existing sentences by analyzing chat text
  sentencesData.sentences.forEach(sentence => {
    const words = sentence.chat.split(' ');
    words.forEach(word => {
      // Remove common prefixes and suffixes to find root verbs
      const cleanWord = word.toLowerCase()
        .replace(/^(ana|ekhtee|ukhooy|umm|abu|ne7an|hum)\s+/, '')
        .replace(/^(ya|ta|na)/, '')
        .replace(/(oon|een|ah)$/, '');
      existingVerbs.add(cleanWord);
    });
  });
  
  return Array.from(existingVerbs);
}

// Function to generate a contextual sentence using OpenAI
async function generateSentenceForVerb(verb) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are an expert in Arabic language learning. Generate a simple sentence using the given Arabic verb in arabizi (Franco-Arabic) format. The sentence should:

1. Use family members or common subjects (ana, ekhtee, ukhooy, umm, abu, ne7an, hum)
2. Include colors, adjectives, or common objects
3. Be beginner-friendly and clear
4. Use only words that would be found in a basic Arabic vocabulary

Examples:
- "ana aakel el toffaa7 el a7mar" (I eat the red apple)
- "ekhtee tashrab el mai el bared" (My sister drinks the cold water)
- "ukhooy yadhak bser3ah" (My brother laughs quickly)

Return only the arabizi sentence, nothing else.`
      }, {
        role: "user",
        content: `Generate a simple sentence using the verb: ${verb.chat} (${verb.eng})`
      }],
      max_tokens: 50,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating sentence:', error);
    return null;
  }
}

// Function to convert arabizi to Arabic
async function convertArabiziToArabic(arabiziText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Convert the given arabizi text to proper Arabic script. Only return the Arabic text, nothing else.

Examples:
- "ana aakel el toffaa7 el a7mar" → "أنا آكل التفاح الأحمر"
- "ekhtee tashrab el mai el bared" → "أختي تشرب الماء البارد"`
      }, {
        role: "user",
        content: arabiziText
      }],
      max_tokens: 100,
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error converting to Arabic:', error);
    return arabiziText;
  }
}

// Function to generate English translation
async function generateEnglishTranslation(arabiziText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `Translate the given arabizi (Franco-Arabic) text to natural English. Only return the English translation, nothing else.

Examples:
- "ana aakel el toffaa7 el a7mar" → "I eat the red apple"
- "ekhtee tashrab el mai el bared" → "My sister drinks the cold water"`
      }, {
        role: "user",
        content: arabiziText
      }],
      max_tokens: 50,
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating English translation:', error);
    return arabiziText;
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
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
    console.log(`✅ Generated audio: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error generating audio:`, error);
    return false;
  }
}

// Function to generate image using OpenAI DALL-E
async function generateImage(prompt, outputPath) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });

    const imageUrl = response.data[0].url;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    fs.writeFileSync(outputPath, Buffer.from(imageBuffer));
    console.log(`✅ Generated image: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error generating image:`, error);
    return false;
  }
}

// Function to generate 4 contextual images for a sentence
async function generateImagesForSentence(sentence, english, sentenceId) {
  const correctPrompt = `A realistic illustration showing: ${english}`;
  
  // Generate 3 distractor prompts
  const distractorResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `Generate 3 similar but incorrect image descriptions for a language learning game. The correct sentence is: "${english}". 

Create 3 contextually similar but wrong alternatives that could be plausible distractors. Focus on changing:
- The subject (different person/family member)
- The object (different item/color)
- The action (similar but different verb)

Return only 3 short, clear descriptions separated by newlines. No numbering or extra text.`
    }, {
      role: "user",
      content: `Main sentence: ${english}`
    }],
    max_tokens: 150,
    temperature: 0.8,
  });

  const distractors = distractorResponse.choices[0].message.content.trim().split('\n');
  
  const prompts = [
    correctPrompt,
    `A realistic illustration showing: ${distractors[0] || 'A person doing a similar activity'}`,
    `A realistic illustration showing: ${distractors[1] || 'A different person doing the same activity'}`,
    `A realistic illustration showing: ${distractors[2] || 'A person doing the activity with different objects'}`
  ];
  
  const imagePaths = [];
  for (let i = 0; i < 4; i++) {
    const imagePath = path.join(__dirname, 'pictures', `sentence_${sentenceId}_${i + 1}.png`);
    imagePaths.push(`pictures/sentence_${sentenceId}_${i + 1}.png`);
    
    console.log(`🎨 Generating image ${i + 1}/4 for sentence ${sentenceId}`);
    await generateImage(prompts[i], imagePath);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return imagePaths;
}

// Main function to analyze and generate content
async function analyzeAndGenerateVerb() {
  console.log('🔍 Analyzing verbs from logic.json...');
  
  const allVerbs = getVerbsFromLogic();
  const existingVerbs = getExistingVerbsFromSentences();
  
  console.log(`📊 VERB ANALYSIS:`);
  console.log(`   • Total verbs in logic.json: ${allVerbs.length}`);
  console.log(`   • Existing sentences: ${existingVerbs.length}`);
  
  // Find verbs not yet covered by checking if the verb's chat value appears in any existing sentence
  const sentencesPath = path.join(__dirname, 'sentences.json');
  let existingSentences = [];
  if (fs.existsSync(sentencesPath)) {
    const sentencesData = JSON.parse(fs.readFileSync(sentencesPath, 'utf8'));
    existingSentences = sentencesData.sentences || [];
  }
  
  // Create a set of verbs that are already covered
  const coveredVerbs = new Set();
  existingSentences.forEach(sentence => {
    allVerbs.forEach(verb => {
      if (sentence.chat.includes(verb.chat)) {
        coveredVerbs.add(verb.chat);
      }
    });
  });
  
  const uncoveredVerbs = allVerbs.filter(verb => !coveredVerbs.has(verb.chat));
  
  console.log(`   • Verbs already covered: ${coveredVerbs.size}`);
  console.log(`   • Verbs needing sentences: ${uncoveredVerbs.length}`);
  
  if (uncoveredVerbs.length === 0) {
    console.log('🎉 All verbs are already covered!');
    return;
  }
  
  console.log(`\n📋 UNCOVERED VERBS (showing last 10 - processing from end):`);
  const lastTenVerbs = uncoveredVerbs.slice(-10);
  lastTenVerbs.forEach((verb, index) => {
    const actualIndex = uncoveredVerbs.length - 10 + index + 1;
    console.log(`   ${actualIndex}. ${verb.chat} (${verb.eng}) - ${verb.ar}`);
  });
  
  // Process the LAST uncovered verb (most advanced/uncommon)
  const verbToProcess = uncoveredVerbs[uncoveredVerbs.length - 1];
  console.log(`\n🎯 Processing verb: ${verbToProcess.chat} (${verbToProcess.eng})`);
  
  // Generate sentence
  console.log('📝 Generating sentence...');
  const arabiziSentence = await generateSentenceForVerb(verbToProcess);
  if (!arabiziSentence) {
    console.log('❌ Failed to generate sentence');
    return;
  }
  
  console.log(`✅ Generated arabizi: ${arabiziSentence}`);
  
  // Convert to Arabic
  console.log('🔄 Converting to Arabic...');
  const arabicSentence = await convertArabiziToArabic(arabiziSentence);
  console.log(`✅ Arabic: ${arabicSentence}`);
  
  // Generate English translation
  console.log('🌐 Generating English translation...');
  const englishSentence = await generateEnglishTranslation(arabiziSentence);
  console.log(`✅ English: ${englishSentence}`);
  
  // Generate next sentence ID
  const nextId = existingSentences.length + 1;
  
  // Generate audio
  console.log('🎵 Generating audio...');
  const audioPath = path.join(__dirname, 'sounds', `sentence_${nextId}.mp3`);
  await generateAudio(arabicSentence, audioPath);
  
  // Generate images
  console.log('🎨 Generating images...');
  const imagePaths = await generateImagesForSentence(arabiziSentence, englishSentence, nextId);
  
  // Create new sentence object
  const newSentence = {
    id: `sentence_${nextId}`,
    arabic: arabicSentence,
    chat: arabiziSentence.replace(/"/g, '').replace(/\s*\([^)]*\)\s*$/, '').trim(), // Clean chat field
    english: englishSentence,
    audioPath: `sounds/sentence_${nextId}.mp3`,
    images: imagePaths,
    correctImageIndex: 0,
    verb: verbToProcess.chat,
    createdAt: new Date().toISOString()
  };
  
  // Add to sentences.json
  const updatedSentences = [...existingSentences, newSentence];
  const updatedData = {
    sentences: updatedSentences,
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(sentencesPath, JSON.stringify(updatedData, null, 2));
  
  // Update dist version
  const distSentencesPath = path.join(__dirname, 'dist', 'sentences.json');
  if (fs.existsSync(distSentencesPath)) {
    fs.writeFileSync(distSentencesPath, JSON.stringify(updatedData, null, 2));
  }
  
  console.log('\n🎉 Successfully generated content for verb!');
  console.log(`📋 Summary:`);
  console.log(`   • Verb: ${verbToProcess.chat} (${verbToProcess.eng})`);
  console.log(`   • Sentence: ${arabiziSentence}`);
  console.log(`   • Total sentences now: ${updatedSentences.length}`);
  console.log(`   • Remaining verbs: ${uncoveredVerbs.length - 1}`);
  
  if (uncoveredVerbs.length > 1) {
    const nextVerb = uncoveredVerbs[uncoveredVerbs.length - 2];
    console.log(`\n💡 Run the script again to process the next verb: ${nextVerb.chat} (${nextVerb.eng})`);
  }
}

// Run the script
if (require.main === module) {
  analyzeAndGenerateVerb().catch(console.error);
}

module.exports = { analyzeAndGenerateVerb };