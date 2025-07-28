const OpenAI = require('openai');
const fs = require('fs');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

const questionWords = [
  { arabizi: 'wain', english: 'where', meaning: 'asking about location' },
  { arabizi: 'emnoo', english: 'who', meaning: 'asking about people' },
  { arabizi: 'kaif', english: 'how', meaning: 'asking about condition/manner' },
  { arabizi: 'laish', english: 'why', meaning: 'asking for reason' },
  { arabizi: 'shoo', english: 'what', meaning: 'asking about things/information' },
  { arabizi: 'meta', english: 'when', meaning: 'asking about time' },
  { arabizi: 'kam', english: 'how many/much', meaning: 'asking about quantity/age' },
  { arabizi: 'ay', english: 'which', meaning: 'asking about choice/selection' }
];

const generateQuestionsForWord = async (questionWord, count = 3) => {
  const prompt = `Generate ${count} simple English questions that would use "${questionWord.english}" (${questionWord.arabizi} in Arabic/Emirati dialect).

Requirements:
- Questions should be simple, everyday conversational questions
- Similar to: "Where is your daughter?", "Why are you happy?", "How is the work?"
- Questions should be realistic things people ask in daily life
- Each question should clearly require the "${questionWord.english}" word
- Avoid complex grammar or uncommon vocabulary
- Focus on family, work, daily activities, emotions, locations, etc.

Format each question as just the English text, one per line.

Examples for reference:
- Where is your car?
- Who is the teacher?
- How is your health?
- Why are you tired?
- What is your job?
- When is lunch?
- How old is she?
- Which color do you like?

Generate ${count} questions for "${questionWord.english}":`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are helping create Arabic language learning content. Generate simple, everyday English questions that Arabic learners would find useful."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const questions = response.choices[0].message.content
      .split('\n')
      .map(q => q.trim())
      .filter(q => q && !q.match(/^\d+\.?\s*/))  // Remove numbered prefixes
      .map(q => q.replace(/^-\s*/, ''))  // Remove dash prefixes
      .slice(0, count);

    return questions.map((englishQuestion, index) => {
      // Generate a simple Arabizi version (this would need refinement)
      const arabizi = `${questionWord.arabizi} ${generateSimpleArabizi(englishQuestion, questionWord)}`;
      
      return {
        id: `${questionWord.arabizi}_gen_${index + 1}`,
        english: englishQuestion,
        verbStem: questionWord.arabizi,
        correct: questionWord.arabizi,
        options: generateOptions(questionWord.arabizi),
        explanation: `${questionWord.arabizi} = ${questionWord.english} (${questionWord.meaning})`,
        category: getCategoryForQuestion(englishQuestion),
        question: arabizi
      };
    });

  } catch (error) {
    console.error(`Error generating questions for ${questionWord.arabizi}:`, error.message);
    return [];
  }
};

const generateSimpleArabizi = (englishQuestion, questionWord) => {
  // Simple mapping for common words - this is a basic approximation
  const commonMappings = {
    'your': 'your',
    'the': 'el',
    'is': '',
    'are': '',
    'you': 'you',
    'car': 'sayyara',
    'house': 'bayt',
    'work': 'sheghel',
    'job': 'sheghel',
    'name': 'ism',
    'mother': 'um',
    'father': 'abu',
    'friend': 'sadeeq',
    'school': 'madrasa',
    'hospital': 'mustashfa',
    'restaurant': 'mat3am',
    'phone': 'telifoon',
    'book': 'kitab',
    'happy': 'mistaanes',
    'tired': 'ta3ban',
    'busy': 'mashghool',
    'late': 'met\'akher',
    'old': '3umr',
    'time': 'waqt',
    'today': 'elyoum',
    'tomorrow': 'baacher',
    'lunch': 'ghada',
    'dinner': '3asha'
  };

  // This is a very basic approximation - in reality you'd want more sophisticated translation
  let simplified = englishQuestion.toLowerCase()
    .replace(/[?]/g, '')
    .replace(/\b(is|are|do|does)\b/g, '')
    .trim();

  // For this demo, we'll create simple patterns
  if (questionWord.english === 'where') {
    if (simplified.includes('car')) return 'el sayyara';
    if (simplified.includes('house')) return 'baytik';
    if (simplified.includes('work')) return 'el sheghel';
    return 'hadha';  // this/that as fallback
  } else if (questionWord.english === 'who') {
    if (simplified.includes('teacher')) return 'el mudarres';
    if (simplified.includes('friend')) return 'sadeeqik';
    return 'hadha';
  } else if (questionWord.english === 'what') {
    if (simplified.includes('name')) return 'ismik';
    if (simplified.includes('job')) return 'sheghelik';
    return 'hadha';
  } else if (questionWord.english === 'when') {
    if (simplified.includes('lunch')) return 'el ghada';
    if (simplified.includes('meeting')) return 'el ejtima3';
    return 'hadha';
  } else if (questionWord.english === 'how many' || questionWord.english === 'how much') {
    if (simplified.includes('old')) return '3umrik';
    if (simplified.includes('children')) return '3yaal 3indik';
    return '3indik';
  } else if (questionWord.english === 'why') {
    if (simplified.includes('happy')) return 'mistaanes';
    if (simplified.includes('tired')) return 'ta3ban';
    if (simplified.includes('late')) return 'met\'akher';
    return 'chee';
  } else if (questionWord.english === 'how') {
    if (simplified.includes('work')) return 'el sheghel';
    if (simplified.includes('health')) return 'sa7tik';
    return 'hal';
  }
  
  return 'hadha';  // fallback
};

const generateOptions = (correctAnswer) => {
  const allWords = ['wain', 'emnoo', 'kaif', 'laish', 'shoo', 'meta', 'kam', 'ay'];
  const otherWords = allWords.filter(w => w !== correctAnswer);
  
  // Randomly select 3 other words
  const shuffled = otherWords.sort(() => Math.random() - 0.5);
  const options = [correctAnswer, ...shuffled.slice(0, 3)];
  
  // Shuffle the final options
  return options.sort(() => Math.random() - 0.5);
};

const getCategoryForQuestion = (question) => {
  const q = question.toLowerCase();
  if (q.includes('work') || q.includes('job') || q.includes('office')) return 'work';
  if (q.includes('family') || q.includes('mother') || q.includes('father') || q.includes('son') || q.includes('daughter')) return 'family';
  if (q.includes('food') || q.includes('lunch') || q.includes('dinner') || q.includes('restaurant')) return 'food';
  if (q.includes('school') || q.includes('teacher') || q.includes('student')) return 'education';
  if (q.includes('house') || q.includes('home') || q.includes('room')) return 'location';
  if (q.includes('happy') || q.includes('sad') || q.includes('tired')) return 'emotions';
  if (q.includes('time') || q.includes('today') || q.includes('tomorrow')) return 'time';
  return 'general';
};

const main = async () => {
  console.log('🤖 Generating additional question word challenges...\n');
  
  const allNewChallenges = [];
  
  for (const questionWord of questionWords) {
    console.log(`Generating questions for "${questionWord.arabizi}" (${questionWord.english})...`);
    const questions = await generateQuestionsForWord(questionWord, 3);  // 3 per word = 24 total
    
    console.log(`Generated ${questions.length} questions:`);
    questions.forEach(q => console.log(`  - ${q.english}`));
    console.log('');
    
    allNewChallenges.push(...questions);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Total generated: ${allNewChallenges.length} new challenges`);
  
  // Save to a file that can be easily copied into the game
  const outputContent = `// Generated question word challenges - add these to QuestionWordMatchGame.js

const newChallenges = ${JSON.stringify(allNewChallenges, null, 2)};

// Copy the challenges from newChallenges array and add them to the existing challenges array in QuestionWordMatchGame.js
`;

  fs.writeFileSync('generated-question-challenges.js', outputContent);
  console.log('\n✅ Saved generated challenges to: generated-question-challenges.js');
  console.log('📋 Copy the challenges from this file and add them to QuestionWordMatchGame.js');
};

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateQuestionsForWord, questionWords };