// Generate additional question word challenges manually
// Based on common everyday conversation patterns

const generateOptions = (correctAnswer) => {
  const allWords = ['wain', 'emnoo', 'kaif', 'laish', 'shoo', 'meta', 'kam', 'ay'];
  const otherWords = allWords.filter(w => w !== correctAnswer);
  
  // Randomly select 3 other words
  const shuffled = otherWords.sort(() => Math.random() - 0.5);
  const options = [correctAnswer, ...shuffled.slice(0, 3)];
  
  // Shuffle the final options
  return options.sort(() => Math.random() - 0.5);
};

const newChallenges = [
  // Additional WAIN (Where) questions
  {
    id: 'where_car',
    english: 'Where is your car?',
    correctAnswer: 'wain',
    options: generateOptions('wain'),
    explanation: 'wain = where (asking about location)',
    category: 'location',
    question: 'wain sayyartik'
  },
  {
    id: 'where_office',
    english: 'Where is the office?',
    correctAnswer: 'wain',
    options: generateOptions('wain'),
    explanation: 'wain = where (asking about location)',
    category: 'location',
    question: 'wain el maktab'  
  },
  {
    id: 'where_bathroom',
    english: 'Where is the bathroom?',
    correctAnswer: 'wain',
    options: generateOptions('wain'),
    explanation: 'wain = where (asking about location)',
    category: 'location',
    question: 'wain el 7ammam'
  },

  // Additional EMNOO (Who) questions
  {
    id: 'who_teacher',
    english: 'Who is the teacher?',
    correctAnswer: 'emnoo',
    options: generateOptions('emnoo'),
    explanation: 'emnoo = who (asking about people)',
    category: 'people',
    question: 'emnoo el mudarres'
  },
  {
    id: 'who_calling',
    english: 'Who is calling?',
    correctAnswer: 'emnoo',
    options: generateOptions('emnoo'),
    explanation: 'emnoo = who (asking about people)',
    category: 'people',
    question: 'emnoo yetesel'
  },
  {
    id: 'who_friend',
    english: 'Who is your friend?',
    correctAnswer: 'emnoo',
    options: generateOptions('emnoo'),
    explanation: 'emnoo = who (asking about people)',
    category: 'people',
    question: 'emnoo sadeeqik'
  },

  // Additional KAIF (How) questions
  {
    id: 'how_health',
    english: 'How is your health?',
    correctAnswer: 'kaif',
    options: generateOptions('kaif'),
    explanation: 'kaif = how (asking about condition/manner)',
    category: 'condition',
    question: 'kaif sa7tik'
  },
  {
    id: 'how_weather',
    english: 'How is the weather?',
    correctAnswer: 'kaif',
    options: generateOptions('kaif'),
    explanation: 'kaif = how (asking about condition/manner)',
    category: 'condition',
    question: 'kaif el jaw'
  },
  {
    id: 'how_family',
    english: 'How is your family?',
    correctAnswer: 'kaif',
    options: generateOptions('kaif'),
    explanation: 'kaif = how (asking about condition/manner)',
    category: 'condition',
    question: 'kaif el 3a2ila'
  },

  // Additional LAISH (Why) questions
  {
    id: 'why_tired',
    english: 'Why are you tired?',
    correctAnswer: 'laish',
    options: generateOptions('laish'),
    explanation: 'laish = why (asking for reason)',
    category: 'reason',
    question: 'laish ta3ban'
  },
  {
    id: 'why_busy',
    english: 'Why are you busy?',
    correctAnswer: 'laish',
    options: generateOptions('laish'),
    explanation: 'laish = why (asking for reason)',
    category: 'reason',
    question: 'laish mashghool'
  },
  {
    id: 'why_expensive',
    english: 'Why is it expensive?',
    correctAnswer: 'laish',
    options: generateOptions('laish'),
    explanation: 'laish = why (asking for reason)',
    category: 'reason',
    question: 'laish ghali'
  },

  // Additional SHOO (What) questions
  {
    id: 'what_job',
    english: 'What is your job?',
    correctAnswer: 'shoo',
    options: generateOptions('shoo'),
    explanation: 'shoo = what (asking about things/information)',
    category: 'information',
    question: 'shoo sheghelik'
  },
  {
    id: 'what_time',
    english: 'What time is it?',
    correctAnswer: 'shoo',
    options: generateOptions('shoo'),
    explanation: 'shoo = what (asking about things/information)',
    category: 'information',
    question: 'shoo el waqt'
  },
  {
    id: 'what_problem',
    english: 'What is the problem?',
    correctAnswer: 'shoo',
    options: generateOptions('shoo'),
    explanation: 'shoo = what (asking about things/information)',
    category: 'information',
    question: 'shoo el mushkila'
  },

  // Additional META (When) questions
  {
    id: 'when_meeting',
    english: 'When is the meeting?',
    correctAnswer: 'meta',
    options: generateOptions('meta'),
    explanation: 'meta = when (asking about time)',
    category: 'time',
    question: 'meta el ejtima3'
  },
  {
    id: 'when_vacation',
    english: 'When is your vacation?',
    correctAnswer: 'meta',
    options: generateOptions('meta'),
    explanation: 'meta = when (asking about time)',
    category: 'time',
    question: 'meta ijaztak'
  },
  {
    id: 'when_wedding',
    english: 'When is the wedding?',
    correctAnswer: 'meta',
    options: generateOptions('meta'),
    explanation: 'meta = when (asking about time)',
    category: 'time',
    question: 'meta el 3urs'
  },

  // Additional KAM (How many/much) questions
  {
    id: 'how_many_children',
    english: 'How many children do you have?',
    correctAnswer: 'kam',
    options: generateOptions('kam'),
    explanation: 'kam = how many/much (asking about quantity)',
    category: 'quantity',
    question: 'kam walad 3indik'
  },
  {
    id: 'how_much_cost',
    english: 'How much does it cost?',
    correctAnswer: 'kam',
    options: generateOptions('kam'),
    explanation: 'kam = how many/much (asking about price/quantity)',
    category: 'quantity',
    question: 'kam yeswa'
  },
  {
    id: 'how_many_hours',
    english: 'How many hours?',
    correctAnswer: 'kam',
    options: generateOptions('kam'),
    explanation: 'kam = how many/much (asking about quantity)',
    category: 'quantity',
    question: 'kam sa3a'
  },

  // Additional AY (Which) questions
  {
    id: 'which_color',
    english: 'Which color do you like?',
    correctAnswer: 'ay',
    options: generateOptions('ay'),
    explanation: 'ay = which (asking about choice/selection)',
    category: 'choice',
    question: 'ay loan t7eb'
  },
  {
    id: 'which_car',
    english: 'Which car is yours?',
    correctAnswer: 'ay',
    options: generateOptions('ay'),
    explanation: 'ay = which (asking about choice/selection)',
    category: 'choice',
    question: 'ay sayyara maltak'
  },
  {
    id: 'which_day',
    english: 'Which day works for you?',
    correctAnswer: 'ay',
    options: generateOptions('ay'),
    explanation: 'ay = which (asking about choice/selection)',
    category: 'choice',
    question: 'ay youm yenasibik'
  }
];

console.log(`Generated ${newChallenges.length} new challenges:`);
newChallenges.forEach((challenge, index) => {
  console.log(`${index + 1}. ${challenge.english} (${challenge.correctAnswer})`);
});

console.log('\n📋 Copy these challenges and add them to QuestionWordMatchGame.js');

// Export for use
module.exports = newChallenges;