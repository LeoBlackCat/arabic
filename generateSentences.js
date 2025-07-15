const fs = require('fs');
const path = require('path');
require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load logic.json to get available words
const logicData = JSON.parse(fs.readFileSync(path.join(__dirname, 'logic.json'), 'utf8'));

// Extract all words from logic.json
const extractWords = () => {
  const words = {
    arabic: [],
    chat: [],
    english: []
  };
  
  logicData.items.forEach(item => {
    if (item.ar) words.arabic.push(item.ar);
    if (item.chat) words.chat.push(item.chat);
    if (item.eng) words.english.push(item.eng);
  });
  
  return words;
};

// Validate that a sentence only uses words from our vocabulary
const validateSentence = (sentence, words) => {
  // Remove numbering and clean the sentence
  const cleanSentence = sentence.replace(/^\d+\.\s*/, '').trim();
  
  // Split sentence into words (handling Arabic RTL and spaces)
  const sentenceWords = cleanSentence.split(/\s+/).filter(w => w.length > 0);
  
  for (const word of sentenceWords) {
    const cleanWord = word.replace(/[،؟!.,?!]/g, ''); // Remove punctuation
    
    // Skip empty words
    if (cleanWord.length === 0) continue;
    
    // Check if word exists in our vocabulary (case-insensitive)
    const exists = words.chat.some(vocabWord => 
      vocabWord.toLowerCase() === cleanWord.toLowerCase() ||
      vocabWord.toLowerCase().includes(cleanWord.toLowerCase()) ||
      cleanWord.toLowerCase().includes(vocabWord.toLowerCase())
    );
    
    if (!exists) {
      console.log(`❌ Word "${cleanWord}" not found in vocabulary`);
      return false;
    }
  }
  
  return true;
};

// Generate 5 sentences with conjunctions, colors, adverbs, adjectives and family members
const generateComplexSentences = async (words) => {
  const vocabList = logicData.items.map(item => 
    `${item.chat} = ${item.ar} = ${item.eng}`
  ).join('\n');
  
  // Get available elements from vocabulary
  const colors = logicData.items.filter(item => item.type === 'colors');
  const adjectives = logicData.items.filter(item => item.pos === 'adjective');
  const adverbs = logicData.items.filter(item => item.pos === 'adverb');
  const conjunctions = logicData.items.filter(item => item.pos === 'conjunction');
  const family = logicData.items.filter(item => item.type === 'family');
  
  const prompt = `Create exactly 5 simple Arabic sentences using family members and colors. Use ONLY words from the vocabulary list.

VOCABULARY LIST (chat = Arabic = English):
${vocabList}

Examples:
ummee 3endhaa sayyaarah a7mar
ukhooy yashrab chai asfar
ekhtee 3endhaa kitaab azrag

Generate exactly 5 sentences now. Output only the sentences, one per line:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an Arabic language teacher who creates conjugation sentences using only provided vocabulary.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });
    
    const generatedText = response.choices[0].message.content.trim();
    const sentences = generatedText.split('\n').filter(line => line.trim().length > 0);
    
    // Validate each sentence
    const validSentences = [];
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      const cleanedSentence = trimmedSentence.replace(/^\d+\.\s*/, '').trim();
      
      if (validateSentence(trimmedSentence, words)) {
        validSentences.push(cleanedSentence);
        console.log(`✅ Valid: ${cleanedSentence}`);
      } else {
        console.log(`❌ Invalid: ${cleanedSentence}`);
      }
    }
    
    return validSentences;
    
  } catch (error) {
    console.error(`❌ Error generating sentences for verb ${verb.chat}:`, error);
    return [];
  }
};

// Generate 5 complex sentences with family, conjunctions, colors, adjectives, adverbs
const generateFiveSentences = async () => {
  const words = extractWords();
  
  console.log('📚 Loaded vocabulary:');
  console.log(`- Arabic words: ${words.arabic.length}`);
  console.log(`- Chat words: ${words.chat.length}`);
  console.log(`- English words: ${words.english.length}`);
  
  console.log('\n🎯 Generating 5 complex sentences with family, conjunctions, colors, adjectives, adverbs...');
  
  const sentences = await generateComplexSentences(words);
  
  console.log(`\n📊 Summary:`);
  console.log(`- Generated ${sentences.length} sentences`);
  
  return sentences;
};

// Read existing sentences and add new ones
const updateSentencesFile = async () => {
  try {
    // Read existing sentences
    let existingSentences = [];
    const sentencesPath = path.join(__dirname, 'sentences.txt');
    
    if (fs.existsSync(sentencesPath)) {
      const existingContent = fs.readFileSync(sentencesPath, 'utf8');
      existingSentences = existingContent.split('\n').filter(line => line.trim().length > 0);
      console.log(`📝 Found ${existingSentences.length} existing sentences`);
    }
    
    // Generate new sentences with family, conjunctions, colors, adjectives, adverbs
    const newSentences = await generateFiveSentences();
    
    if (newSentences.length === 0) {
      console.log('❌ No valid sentences generated');
      return;
    }
    
    // Combine and deduplicate
    const allSentences = [...existingSentences, ...newSentences];
    const uniqueSentences = [...new Set(allSentences)];
    
    // Write back to file
    fs.writeFileSync(sentencesPath, uniqueSentences.join('\n') + '\n');
    
    console.log(`\n📄 Updated sentences.txt:`);
    console.log(`- Total sentences: ${uniqueSentences.length}`);
    console.log(`- New sentences added: ${newSentences.length}`);
    console.log(`- Existing sentences: ${existingSentences.length}`);
    
    console.log('\n📝 Final sentences.txt content:');
    uniqueSentences.forEach((sentence, index) => {
      console.log(`${index + 1}. ${sentence}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating sentences file:', error);
  }
};

// Run the script
if (require.main === module) {
  updateSentencesFile();
}

module.exports = { generateFiveSentences, validateSentence, extractWords };